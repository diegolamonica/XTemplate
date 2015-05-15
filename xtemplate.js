var Xtemplate = (function (XTEMPLATE_DEBUG) {
    'use strict';

    var _INSTANCE = null;
    if (XTEMPLATE_DEBUG === undefined) XTEMPLATE_DEBUG = false;
    return function Xtemplate() {
        var that = this;

        if (_INSTANCE) return _INSTANCE;

        var that = _INSTANCE = this;

        var $ = jQuery, // Forcing $ to be jQuery (we are in a safe context here)
            templateElements = {};
        $('[type="text/x-template"]').each(function () {
            templateElements['#' + $(this).attr('id')] = $(this).text();
            $(this).remove();
        });
        var log = function(something){
            if(XTEMPLATE_DEBUG){

                console.log(something);
            }
        }
        var safeEval = function(template, row){

            var changed = true;

            while(changed) {

                var expressions = /\{=(.*?)}/g,
                    changed = false;

                while (true) {
                    // Blocking XMLHttpRequest
                    var randomVarName = parseInt(Math.random() * 1000),
                        safeXHRDeclaration = 'var __safeXHR1_' + randomVarName + ' = window.XMLHttpRequest;\n' +
                                             '\t__safeXHR2_' + randomVarName + ' = XMLHttpRequest;\n' +
                                            'window.XMLHttpRequest = null;\n' +
                                            'XMLHttpRequest = null;\n',
                        declaration = 'var ';

                    var expression = expressions.exec(template);
                    if (!expression) break;

                    for (var key in row) {
                        log(typeof(row[key]));
                        var value = row[key],
                            safeValue = (typeof( value ) == 'string') ? '"' + value.replace(/"/g, '\\"') + '"' : value;
                        declaration += key + ' = ' + safeValue + ',\n\t';

                    }

                    var functionBody = safeXHRDeclaration + declaration + '__safeEval_assignment = ' + expression[1] + ';\n' +
                        '\nwindow.XMLHttpRequest= __safeXHR1_' + randomVarName + ';' +
                        '\nXMLHttpRequest= __safeXHR2_' + randomVarName + ';' +
                        '\n\nreturn __safeEval_assignment;\n/*\n * ---------------\n */';
                    log(functionBody);
                    try {
                        var f = new Function(functionBody),
                            result = f();
                    }catch(e){
                        var result = e;
                    }
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
                    template = template.replace('{@' + j + '}', subpatternTemplate);
                }
            }
            return template;
        };
        var evaluateConditions = function (templateString, items) {

            var rx = /{\?([^}]+)}([\s\S]*?)\{\!\1}/gm,
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
        this.applyString = function (templateString, items, callback) {

            if (typeof(callback) == 'function') items = callback(items);
            templateString = evaluateConditions(templateString, items);

            var template = safeEval(templateString, items);

            for (var key in items) {
                var rx = new RegExp('{\\$' + key + '}', 'g');
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
                var rx = /(\{(#.*?)\})/im;

                while (true) {
                    var subpattern = rx.exec(defaultTemplate);

                    if (subpattern == null) break;
                    subpatterns.push(subpattern[2]);
                    defaultTemplate = defaultTemplate.replace(subpattern[0], '{@' + (subpatterns.length - 1) + '}');
                }

                var template = that.applyString(defaultTemplate, row[i], callback);
                template = manageSubPatterns(subpatterns, row[i], template, callback);

                if ($appendTo !== undefined) {
                    $appendTo.append(template);
                } else {
                    buffer += template;
                }

            }

            return buffer;
        };

    };
})();