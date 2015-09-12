/**
 * XTemplate: HTML Fragment templating class.
 * @class Xtemplate
 * @version 1.5
 * @link https://github.com/diegolamonica/XTemplate/
 * @author Diego La Monica (diegolamonica) <diego.lamonica@gmail.com>
 * @copyright 2015 Diego La Monica
 * @license http://www.gnu.org/licenses/lgpl-3.0-standalone.html GNU Lesser General Public License
 * @note This program is distributed in the hope that it will be useful - WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */
/** @const */ var XTEMPLATE_PRIORITY_BEFORE_CALLBACK        = 0;
/** @const */ var XTEMPLATE_PRIORITY_BEFORE_TRANSLATIONS    = 1;
/** @const */ var XTEMPLATE_PRIORITY_BEFORE_EXPRESSION      = 2;
/** @const */ var XTEMPLATE_PRIORITY_BEFORE_CONDITIONS      = 3;
/** @const */ var XTEMPLATE_PRIORITY_BEFORE_VAR             = 4;
/** @const */ var XTEMPLATE_PRIORITY_AFTER_VAR              = 5;

/** @const */ var XTEMPLATE_PLACEHOLDER_VAR         = '$';
/** @const */ var XTEMPLATE_PLACEHOLDER_IF_START    = '?';
/** @const */ var XTEMPLATE_PLACEHOLDER_IF_END      = '!';
/** @const */ var XTEMPLATE_PLACEHOLDER_EXPRESSION  = '=';
/** @const */ var XTEMPLATE_PLACEHOLDER_SUBTEMPLATE = '#';
/** @const */ var XTEMPLATE_PLACEHOLDER_TRANSLATION = ':';
/** @const */ var XTEMPLATE_PLACEHOLDER_RESERVED    = '@';

var Xtemplate = (function ($) {
    'use strict';

    /** @const */ var XTEMPLATE_GATHERING_TRANSLATIONS = 0,
        /** @const */ XTEMPLATE_TRANSLATION_ERROR = -1,

        XTEMPLATE_DEBUG         = false,
        XTEMPLATE_LANG          = 'en_US',
        XTEMPLATE_LANG_PATH     = false,
        XTEMPLATE_NESTING_LEVEL = 0,
        XTEMPLATE_AUTO_TRANSLATE = false,
        XTEMPLATE_REPLACE       = false,
        XTEMPLATE_SYNC_MODE     = false;




    var _INSTANCE = null;
    var defaultSettings = {
            debug:          false,
            lang:           'en_US',
            langPath:       false,
            autotranslate:  false,
            replaceContents: false,
            syncMode:       false,
        },
        defaultPlaceholders = {
            XTEMPLATE_PLACEHOLDER_VAR: true,
            XTEMPLATE_PLACEHOLDER_IF_START: true,
            XTEMPLATE_PLACEHOLDER_IF_END: true,
            XTEMPLATE_PLACEHOLDER_EXPRESSION: true,
            XTEMPLATE_PLACEHOLDER_SUBTEMPLATE: true,
            XTEMPLATE_PLACEHOLDER_TRANSLATION: true
        },
        registeredPlaceholders = {};

    var applySettings = function(settings) {
        for (var key in defaultSettings) {
            if (settings[key] === undefined) {
                settings[key] = defaultSettings[key];
            }
        }

        XTEMPLATE_DEBUG         = settings.debug;
        XTEMPLATE_LANG          = settings.lang;
        XTEMPLATE_LANG_PATH     = settings.langPath;
        XTEMPLATE_AUTO_TRANSLATE= settings.autotranslate;
        XTEMPLATE_REPLACE       = settings.replaceContents;
        XTEMPLATE_SYNC_MODE     = settings.syncMode;

    };
    return function Xtemplate(opts) {

        var merge = function() {
            var obj = {};
            for (var i in arguments) {
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        obj[key] = arguments[i][key];
                    }
                }
            }
            return obj;
        };

        registeredPlaceholders = merge(registeredPlaceholders, defaultPlaceholders);

        if(typeof(opts) === 'boolean')  opts = { debug: opts };
        applySettings(opts || {});

        var that = this;

        if (_INSTANCE) return _INSTANCE;

        var that = _INSTANCE = this;

        var templateElements = {},
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
                    async: !XTEMPLATE_SYNC_MODE,
                    success: function(data){
                        log("Data loaded for " + langFile + " in " + thisLang);
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

                var expressions = new RegExp('\\{' + XTEMPLATE_PLACEHOLDER_EXPRESSION + '(.*?)}','g'),
                    changed = false;

                while (true) {
                    // Blocking XMLHttpRequest
                     var expression = expressions.exec(template),
                        declaration = '';

                    if (!expression) break;

                    for (var key in row) {
                        // log(typeof(row[key]));
                        var value = row[key],
                            safeValue = JSON.stringify(value);
                        if(safeValue!= null) {
                            if (declaration != '') declaration += ',\n\t';
                            declaration += key + ' = ' + safeValue + '';
                        }

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

                    // log(functionBody);
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
                    subpatternArgs = merge({}, row);


                if(patternArguments.length==1 && patternArguments[0] == ''){

                }else {

                    for (var k = 0; k < patternArguments.length; k++) {
                        var idx = patternArguments[k].indexOf('='),
                            spParamKey = patternArguments[k].substr(0, idx),
                            spParamVal = patternArguments[k].substring(idx + 1);

                        if (idx > -1) {
                            var value;
                            if (/^("|').*\1$/.test(spParamVal)) {
                                value = spParamVal.replace(/^("|')(.*)\1$/, '$2');
                            } else if( /^\d+(\.\d+)?/.test(spParamVal)){
                                value = spParamVal;
                            } else {

                                value = JSON.stringify(row[spParamVal]);

                            }
                            subpatternArgs[spParamKey] = value;
                        } else {

                            if (patternArguments[k].substr(0, 1) == '+') {
                                var inputSource = row[patternArguments[k].substr(1)];

                                if(typeof( inputSource ) === 'object' && !(inputSource instanceof Array) ){

                                    subpatternArgs = merge(subpatternArgs, inputSource);

                                }else {
                                    if(inputSource instanceof Array &&  patternArguments.length === 1){
                                        subpatternArgs = inputSource
                                    }else{
                                        // I already have the value
                                        // subpatternArgs[patternArguments[k].substr(1)] = inputSource;
                                    }

                                }

                            } else {
                                subpatternArgs[subpatternInfo[k]] = row[subpatternInfo[k]];
                            }
                        }

                    }
                }

                if (template.indexOf('{@' + j + '}') != -1) {
                    var subpatternTemplate = that.apply(subpatternSelector, subpatternArgs, callback);
                    template = template.replace('{' + XTEMPLATE_PLACEHOLDER_RESERVED + j + '}', subpatternTemplate);
                }
            }
            return template;
        };
        var evaluateConditions = function (templateString, items) {
            // /{\?([^}]+)}([\s\S]*?)\{\!\1}/gm
            var rx = new RegExp('{\\' + XTEMPLATE_PLACEHOLDER_IF_START + '([^}]+)}([\\s\\S]*?)\\{\\' + XTEMPLATE_PLACEHOLDER_IF_END + '\\1}', 'gm'),
                changes = false;


            while (true) {
                var matches = rx.exec(templateString);
                if (matches == null) break;
                var isNegation = matches[1].substring(0,1) =='^',
                    matched = !isNegation && (items[matches[1]] !== undefined),
                    notMatched = isNegation && (items[matches[1].substring(1)] === undefined),
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

            if(XTEMPLATE_AUTO_TRANSLATE){
                $('[data-autotranslate="true"]').each(function(){
                    var xdata = $(this).data('xtemplate'),
                        selectorId = '#'+$(this).attr('id'),
                        rows = xdata.currentData,
                        callback = xdata.currentCallback,
                        templateId = xdata.currentTemplate;
                    $(this).html('');
                    that.apply(templateId, rows,callback, selectorId);

                });
            }
        };

        this.register = function (activator, action, priority){
            var closingElement = false,
                ml = false;
            if(activator instanceof Array){
                if(activator.length > 1){
                    closingElement = activator[1];
                    if(activator.length == 3){
                        ml = activator[2];
                    }
                    activator = activator[0];

                }else {
                    return false;
                }
            }

            if( registeredPlaceholders[activator] !== undefined) return false;

            registeredPlaceholders[activator] = {
                closedBy: closingElement,
                callback: action,
                multiline: ml,
                on: priority
            };
            log(registeredPlaceholders);
            return true;
        };

        this.unregister = function (placeholder){
            if( defaultPlaceholders[placeholder] !== undefined ) return false;
            if( registeredPlaceholders[placeholder] !== undefined){
                delete(registeredPlaceholders[placeholder]);
            }
            return true;
        };

        var customPlaceholderReplacement = function (priority, items, translations, templateString){
            log("Evaluating priority: " + priority);
            for(var placeholder in registeredPlaceholders){
                var ph = registeredPlaceholders[placeholder];
                if(ph !== true) log("Checking custom placeholder " + placeholder + " priority (" + ph.on + ")");

                if(ph !== true && ph.on == priority){
                    log("--> ok");
                    log("--> " + templateString);

                    var rxString = "\\{(\\" + placeholder + ')([^}]+)\\}';
                    if(ph.closedBy!=false){
                        rxString+= '(' + (ph.multiline ? '[\\s\\S]':'.') + '*?)';
                        rxString+= '\\{\\' + ph.closedBy + '\\2}';
                    }
                    log("The regex will be: " + rxString);
                    var rx = new RegExp( rxString, 'g' );

                    while(true){
                        var matches = rx.exec(templateString);
                        if( matches == null) break;

                        var result = ph.callback( matches, items, translations);

                        templateString = templateString.replace( matches[0], result );
                        log("--> (replaced) " + templateString);
                    }
                }
            }

            return templateString;
        }

        this.applyString = function (templateString, items, callback, translations) {

            templateString = customPlaceholderReplacement(XTEMPLATE_PRIORITY_BEFORE_CALLBACK, items, translations, templateString);

            if (typeof(callback) == 'function') items = callback(items);

            templateString = customPlaceholderReplacement(XTEMPLATE_PRIORITY_BEFORE_TRANSLATIONS, items, translations, templateString);

            if(translations!=undefined) {
                for (var key in translations) {
                    templateString = templateString.replace(new RegExp('{' + XTEMPLATE_PLACEHOLDER_TRANSLATION + key + '}', 'g'), translations[key]);
                }
            }

            templateString = customPlaceholderReplacement(XTEMPLATE_PRIORITY_BEFORE_CONDITIONS, items, translations, templateString);

            templateString = evaluateConditions(templateString, items);

            templateString = customPlaceholderReplacement(XTEMPLATE_PRIORITY_BEFORE_EXPRESSION, items, translations, templateString);

            var template = safeEval(templateString, items);

            template = customPlaceholderReplacement(XTEMPLATE_PRIORITY_BEFORE_VAR, items, translations, template);

            for (var key in items) {
                var rx = new RegExp('{\\' + XTEMPLATE_PLACEHOLDER_VAR + key + '}', 'g');
                if (items[key] == null) items[key] = '';
                template = template.replace(rx, items[key]);
            }

            template = customPlaceholderReplacement(XTEMPLATE_PRIORITY_AFTER_VAR, items, translations, template);

            return template;
        };

        this.isTranslationReady = function(){
            for(var tf in translationFiles){

                if(translationFiles[tf][XTEMPLATE_LANG] === XTEMPLATE_GATHERING_TRANSLATIONS) return false;


            }
            return true;
        }

        this.apply = function (templateId, rows, callback, intoId) {
            if ((rows == null)) return '';

            if(XTEMPLATE_NESTING_LEVEL == 0){
                // Are all the translations loaded?
                log("Checking if is translation ready");
                if(XTEMPLATE_LANG_PATH !== false && !this.isTranslationReady()){
                    log("Please wait a little bit");
                    setTimeout(function(){
                        that.apply(templateId, rows, callback, intoId);
                    }, 100);

                    return;

                }
            }

            XTEMPLATE_NESTING_LEVEL += 1;
            log("Processing template " + templateId);
            if (templateElements[templateId] === undefined && $(templateId).length > 0) {
                templateElements[templateId] = $(templateId).text();
            }

            var defaultTemplate = (templateElements[templateId] == undefined) ? '' : templateElements[templateId],
                subpatterns = [],
                row = $.isArray(rows) ? rows : [rows],
                buffer = '',
                $appendTo = (intoId === undefined) ? undefined : $(intoId);

            if (row.length == 0) return '';

            for (var i = 0; i < row.length; i++) {

                // Look for sub patterns
                var rx = new RegExp('(\\{(\\' + XTEMPLATE_PLACEHOLDER_SUBTEMPLATE +'.*?)\\})', "im");

                while (true) {
                    var subpattern = rx.exec(defaultTemplate);

                    if (subpattern == null) break;
                    subpatterns.push(subpattern[2]);
                    defaultTemplate = defaultTemplate.replace(subpattern[0], '{' + XTEMPLATE_PLACEHOLDER_RESERVED + (subpatterns.length - 1) + '}');
                }


                var translationFile = translations[templateId],
                    translationDictionary = (XTEMPLATE_LANG_PATH!==false && translationFiles[ translationFile ] &&
                    translationFiles[ translationFile ][XTEMPLATE_LANG])?translationFiles[ translationFile ][XTEMPLATE_LANG]: {};
                log("Getting strings for" + templateId + " in " + XTEMPLATE_LANG);

                var template = that.applyString(defaultTemplate, row[i], callback, translationDictionary);
                template = manageSubPatterns(subpatterns, row[i], template, callback);

                if ($appendTo !== undefined) {
                    if (XTEMPLATE_NESTING_LEVEL == 1 && XTEMPLATE_AUTO_TRANSLATE || XTEMPLATE_REPLACE) {
                        $appendTo.html(template);
                    } else {
                        $appendTo.append(template);
                    }
                } else {
                    buffer += template;
                }
            }
            XTEMPLATE_NESTING_LEVEL -= 1;

            if(XTEMPLATE_NESTING_LEVEL == 0 && $appendTo!== undefined && XTEMPLATE_AUTO_TRANSLATE){
                $appendTo.data('xtemplate', {
                    currentLang: XTEMPLATE_LANG,
                    currentData: rows,
                    currentCallback: callback,
                    currentTemplate: templateId
                }).attr('data-autotranslate', 'true');
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

})(jQuery);