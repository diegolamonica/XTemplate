/**
 * XTemplate: HTML Fragment templating class.
 * @class Xtemplate
 * @version 1.3
 * @link https://github.com/diegolamonica/XTemplate/
 * @author Diego La Monica (diegolamonica) <diego.lamonica@gmail.com>
 * @copyright 2015 Diego La Monica
 * @license http://www.gnu.org/licenses/lgpl-3.0-standalone.html GNU Lesser General Public License
 * @note This program is distributed in the hope that it will be useful - WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */
var Xtemplate = (function () {
    'use strict';

    var XTEMPLATE_GATHERING_TRANSLATIONS = 0,
        XTEMPLATE_TRANSLATION_ERROR = -1,

        XTEMPLATE_DEBUG         = false,
        XTEMPLATE_LANG          = 'en_US',
        XTEMPLATE_LANG_PATH     = false,
        PLACEHOLDER_VAR         = '$',
        PLACEHOLDER_IF_START    = '?',
        PLACEHOLDER_IF_END      = '!',
        PLACEHOLDER_EXPRESSION  = '=',
        PLACEHOLDER_SUBTEMPLATE = '#',
        PLACEHOLDER_TRANSLATION = ':',

        PLACEHOLDER_RESERVED    = '@';

    var _INSTANCE = null;
    // if (XTEMPLATE_DEBUG === undefined) XTEMPLATE_DEBUG = false;
    return function Xtemplate(opts) {

        XTEMPLATE_DEBUG         = ((typeof(opts) === 'boolean') && opts) || (typeof(opts) === 'object' && opts.debug ) || false;
        XTEMPLATE_LANG          = ((typeof(opts) === 'object') && opts.lang) || 'en_US';
        XTEMPLATE_LANG_PATH     = ((typeof(opts) === 'object') && opts.langPath) || false;


        var that = this;

        if (_INSTANCE) return _INSTANCE;

        var that = _INSTANCE = this;


        var $ = jQuery, // Forcing $ to be jQuery (we are in a safe context here)
            templateElements = {},
            translations     = {},
            translationFiles = {};

        var log = function(something){
            if(XTEMPLATE_DEBUG){

                console.log(something);
            }
        }
        var loadLangFile = function(id, langFile){

            if(XTEMPLATE_LANG_PATH !== false && langFile !='' &&
                (translationFiles[langFile] === undefined || translationFiles[langFile] && translationFiles[langFile][XTEMPLATE_LANG] === undefined)){
                if(translationFiles[langFile]=== undefined) translationFiles[langFile] = {};
                translationFiles[langFile][XTEMPLATE_LANG] = XTEMPLATE_GATHERING_TRANSLATIONS;

                translations['#' + id] = langFile;

                var thisLang = XTEMPLATE_LANG,
                    ajaxLangFile = XTEMPLATE_LANG_PATH + thisLang + '/' + langFile;

                log("Loading translations from " + ajaxLangFile);

                $.ajax({
                    type: 'get',
                    url: ajaxLangFile,
                    dataType: 'json',
                    async: false,
                    success: function(data){

                        translationFiles[langFile][thisLang] = data;

                    },
                    error: function(data){
                        log(data);
                        translationFiles[langFile][thisLang] = XTEMPLATE_TRANSLATION_ERROR;
                    }
                });
            }
        };

        var safeEval = function(template, row){

            var changed = true,
                safeDeclaration = 'var safeEval = false;\n';

            while(changed) {

                var expressions = new RegExp('\\{' + PLACEHOLDER_EXPRESSION + '(.*?)}','g'),
                    changed = false;

                while (true) {
                    // Blocking XMLHttpRequest
                     var expression = expressions.exec(template),
                        declaration = '';

                    if (!expression) break;

                    for (var key in row) {
                        log(typeof(row[key]));
                        var value = row[key],
                            safeValue = (typeof( value ) == 'string') ? '"' + value.replace(/"/g, '\\"') + '"' : value;
                        if(declaration!='') declaration +=',\n\t';
                        declaration += key + ' = ' + safeValue + '';

                    }
                    if(declaration!='') declaration = 'var ' + declaration + ';';
                    var safeEval = {
                            'setTimeout':       setTimeout,
                            'setInterval':      setInterval,
                            'XMLHttpRequest':   XMLHttpRequest,
                            'addEventListener': addEventListener
                        },
                        functionBody =  safeDeclaration+
                                        declaration +
                                        '\n\nreturn ' + expression[1] + ';';

                    window.setTimeout       = undefined;
                    window.setInterval      = undefined;
                    window.XMLHttpRequest   = undefined;
                    window.addEventListener = undefined;

                    log(functionBody);
                    try {
                        var f = new Function(functionBody),
                            result = f();
                    }catch( e){
                        var result = e.toString();
                    }

                    window.setTimeout          = safeEval.setTimeout;
                    window.setInterval         = safeEval.setInterval;
                    window.XMLHttpRequest      = safeEval.XMLHttpRequest;
                    window.addEventListener    = safeEval.addEventListener;

                    template = template.replace(expression[0], result);
                    f = null;
                    changed = true;
                }
            }

            return template;
        };
        var manageSubPatterns = function (subpatterns, row, template, callback) {

            for (var j = 0; j < subpatterns.length; j++) {

                var subpatternInfo = subpatterns[j].split(/ /),
                    subpatternSelector = subpatternInfo.shift(),
                    patternArguments = subpatternInfo.join(' ').split(/, ?/),
                    subpatternArgs = row || {};

                for (var k = 0; k < patternArguments.length; k++) {
                    var idx = patternArguments[k].indexOf('='),
                        spParamKey = patternArguments[k].substr(0, idx),
                        spParamVal = patternArguments[k].substring(idx + 1);

                    if (idx > -1) {
                        var value;
                        if (/^("|').*\1$/.test(spParamVal)) {
                            value = spParamVal.replace(/^("|')(.*)\1$/, '$2');
                        } else {
                            value = row[spParamVal];
                        }
                        subpatternArgs[spParamKey] = value;
                    } else {
                        subpatternArgs[subpatternInfo[k]] = row[subpatternInfo[k]];
                    }

                }
                if (template.indexOf('{@' + j + '}') != -1) {
                    var subpatternTemplate = that.apply(subpatternSelector, subpatternArgs, callback);
                    template = template.replace('{' + PLACEHOLDER_RESERVED + j + '}', subpatternTemplate);
                }
            }
            return template;
        };
        var evaluateConditions = function (templateString, items) {
            // /{\?([^}]+)}([\s\S]*?)\{\!\1}/gm
            var rx = new RegExp('{\\' + PLACEHOLDER_IF_START + '([^}]+)}([\\s\\S]*?)\\{\\' + PLACEHOLDER_IF_END + '\\1}', 'gm'),
                changes = false;


            while (true) {
                var matches = rx.exec(templateString);
                if (matches == null) break;
                var isNegation = matches[1].substring(0,1) =='^',
                    matched = !isNegation && (items[matches[1]] != undefined),
                    notMatched = isNegation && (items[matches[1].substring(1)] == undefined),
                    checked = matched || notMatched;

                templateString = templateString.replace(matches[0], checked ? matches[2] : '' );
                changes = true;
            }
            if (changes) templateString = evaluateConditions(templateString, items);
            return templateString;
        };
        this.setLang = function(langName){
            XTEMPLATE_LANG = langName;
            for(var id in translations){
                loadLangFile(id, translations[id]);
            }
        };
        this.applyString = function (templateString, items, callback, translations) {
            log(translations);
            for(var key in translations){
                templateString = templateString.replace( new RegExp('{' + PLACEHOLDER_TRANSLATION + key + '}', 'g'), translations[key]);
            }

            if (typeof(callback) == 'function') items = callback(items);
            templateString = evaluateConditions(templateString, items);

            var template = safeEval(templateString, items);

            for (var key in items) {
                var rx = new RegExp('{\\' + PLACEHOLDER_VAR + key + '}', 'g');
                if (items[key] == null) items[key] = '';
                template = template.replace(rx, items[key]);
            }

            return template;
        };
        this.apply = function (templateId, rows, callback, appendTo) {
            if ((rows == null)) return '';

            if (templateElements[templateId] === undefined && $(templateId).length > 0) {
                templateElements[templateId] = $(templateId).text();
            }

            var defaultTemplate = (templateElements[templateId] == undefined) ? '' : templateElements[templateId],
                subpatterns = [],
                row = $.isArray(rows) ? rows : [rows],
                buffer = '',
                $appendTo = (appendTo === undefined) ? undefined : $(appendTo);

            if (row.length == 0) return '';

            for (var i = 0; i < row.length; i++) {

                // Look for sub patterns
                var rx = new RegExp('(\\{(\\' + PLACEHOLDER_SUBTEMPLATE +'.*?)\\})', "im");

                while (true) {
                    var subpattern = rx.exec(defaultTemplate);

                    if (subpattern == null) break;
                    subpatterns.push(subpattern[2]);
                    defaultTemplate = defaultTemplate.replace(subpattern[0], '{' + PLACEHOLDER_RESERVED + (subpatterns.length - 1) + '}');
                }

                var translationDictionary = (translationFiles[ translations[templateId] ] && translationFiles[ translations[templateId] ][XTEMPLATE_LANG])?translationFiles[ translations[templateId] ][XTEMPLATE_LANG]: {},
                    template = that.applyString(defaultTemplate, row[i], callback, translationDictionary);
                template = manageSubPatterns(subpatterns, row[i], template, callback);

                if ($appendTo !== undefined) {
                    $appendTo.append(template);
                } else {
                    buffer += template;
                }

            }

            return buffer;
        };

        $('[type="text/x-template"]').each(function () {
            var id = $(this).attr('id');
            templateElements['#' + id] = $(this).text();
            loadLangFile(id, $(this).data('lang') || '');
            $(this).remove();
        });

    };

})();