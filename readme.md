# XTemplate
A Simple Javascript library to manage HTML Fragments templates

**To see XTemplate in action download the package and open files of `examples` directory in your browser or else see it on http://diegolamonica.info/demo/xtemplate/**

## 2015-09-12: V 1.5
- Enabled automatic translation action on setting new language
- Now translation files are loaded in async mode (better than the deprecated sync mode)
- **New:** now you can add your own placeholder activators simply
- Added new methods `register` and `unregister` to manage custom placeholder activatos
- Added new method `isTranslationReady`
- Removed some debug messages
- Added other debug messages
- Updated documentation
- Updated example file `translations.html`
- Added example file `autotranslate.html` 
- Added example file `custom-placeholders.html`

For the changelog of previous versions go to the end of this page.


## Dependencies

- JQuery 1.9+

## Basic Usage
Example: `hello-world.html`

Put this fragment in your HTML
```html
<!-- 
Remember that type attribute must be set to "text/x-template" to be recognized as it is.
 Another fundamental thing is to define an id attribute for the script element.
 -->
<script type="text/x-template" id="my-template">
    <div>
        Hello World!
    </div>
</script>

<div id="my-section">This text will be replaced</div> 
```

Then put this code in your Javascript section:

```javascript
var x = new Xtemplate(),
    /*
     * #my-template is the template selector
     */
    output = x.apply('#my-template', {});

$('#my-section').html(output);
```

## Table of contents

* [XTemplate Function Reference](#xtemplate-function-reference)
* [Extending XTemplate Placeholders](#extending-xtemplate-placeholders)
  * [Activator Priorities](#activator-priorities)
  * [Default Activators](#default-activators)
  * [The callback method](#the-callback-method)
  * [Example of custom activators](#example-of-custom-activators)
* [XTemplate Configuration Object](#xtemplate-configuration-object)
* [Templates Syntax](#templates-syntax)
  * [Example of `{$variable}` usage](#example-of-variable-usage)
  * [Example of `{?condition}` usage](#example-of-condition-usage)
  * [Working with `{#subtemplate}`](#working-with-subtemplate)
    * [Basic Syntax example](#basic-syntax-example)
    * [Extended Syntax](#extended-syntax)
    * [Extended Advanced Syntax](#extended-advanced-syntax)
  * [Callback argument usage example](#callback-argument-usage-example)
  * [Using `{=expression}`](#using-expression)
* [Produce multilingual contents](#produce-multilingual-contents)
  * [XTemplate translation labels binding](#xtemplate-translation-labels-binding)
  * [XTemplate translation file structure](#xtemplate-translation-file-structure)
* [ChangeLog](#changelog)

# XTemplate Function Reference
- *`apply (templateId, rows[, callback[, intoId]])`*  
  Uses the template defined as `templateId` in conjunction with the data given in `rows` argument. If `intoId` is not defined the method will output the computed string.  
  **`rows`** can be either an object or an array of objects. However it **must** contain at least an object else the given output will be an empty string.  
  **`callback`** is an optional method that will manipulate each element defined in `rows`. It expect a single argument (the single row) and will returns the altered version of the row. Default value is `undefined`  
  **`intoId`** is the section of the template where to append (or replace if the `replaceContents` option is set to `true`) the computed template.

- *`applyString (templateString, items[, callback[, translations]])`*  
  Uses the template defined as string in conjunction with the data given in `rows` argument and returns the computed string.  
  **`items`** can be either an object or an array of objects. However it **must** contain at least an object else the given output will be an empty string.  
  **`callback`** is an optional method that will manipulate each element defined in `items`. It expect a single argument (the single row) and will returns the altered version of the row. Default value is `undefined`  
  **`translations`** (default `undefined`) is a translation object as described in the section [XTemplate translation file structure](https://github.com/diegolamonica/XTemplate#xtemplate-translation-file-structure) 

- *`setLang(langName)`*
  Set the lang to the new one. It will update the translation strings loading the files from the defined source (see [Produce multilingual contents](#produce-multilingual-contents) section).

- *`register(activator, callback, priority)`*  
  Defines new placeholder activator. The output of the method will be `true` if the activator is correctly registered.
   It will return false if the `activator` is already registered.
   
  **`activator`** can be either a string if it must recognize a simple placeholder (eg. `{&placeholder}`) 
  or an indexed array if it must recognize a complex placeholder, like the condition statement.  
  If it is an array then it must contain at least 2 values: the activator sequence (eg. `&`) in the
  index 0 and the closing block sequence in the index 1.  
  If the third element of the array is defined then it must be a boolean value and determine if the
  inner block accepts multiple line.  
  **`callback`** is the method that will be invoked to process the placeholder contents. To know how to
  build the callback method, see the next section [Extending XTemplate Placeholders](#extending-xtemplate-placeholders)  
  **`priority`** is the position where which to use the registered activator. It can be one of the values
  defined in #Activator Priorities# section.

- *`unregister(activator)`*
  Will remove the activator from the parsing process.
  The method will return `true` it the activator is correctly removed else will return `false`.
  The reason the method will return `false` is because you are trying to remove a default activator.
  

# Extending XTemplate Placeholders
XTemplate allows you to extend its syntax using the method `register`.
The arguments that `register` expects are described in the above **Function reference** section.

## Activator Priorities

The XTemplate flow on how it process templates the sequenze is:
- Applying callback transformation to the items
- Applying the translation strings
- Execute expressions
- Evaluate conditions
- Replacing variables
 
So the allowed priorities values are:
- `XTEMPLATE_PRIORITY_BEFORE_CALLBACK`  
- `XTEMPLATE_PRIORITY_BEFORE_TRANSLATIONS`
- `XTEMPLATE_PRIORITY_BEFORE_EXPRESSION`
- `XTEMPLATE_PRIORITY_BEFORE_CONDITIONS`
- `XTEMPLATE_PRIORITY_BEFORE_VAR`
- `XTEMPLATE_PRIORITY_AFTER_VAR`

## Default Activators
The default activators are reserved and they are:
- `$` for variables identified by the constant `XTEMPLATE_PLACEHOLDER_VAR`
- `?` for conditional block start identified by the constant `XTEMPLATE_PLACEHOLDER_IF_START`
- `!` for conditional block end identified by the constant `XTEMPLATE_PLACEHOLDER_IF_END`
- `=` for expression evaluation identified by the constant `XTEMPLATE_PLACEHOLDER_EXPRESSION`
- `#` for subtemplate sections identified by the constant `XTEMPLATE_PLACEHOLDER_SUBTEMPLATE`
- `:` for trasnlation contents identified by the constant `XTEMPLATE_PLACEHOLDER_TRANSLATION`
- `@` for reserved purposes identified by the constant `XTEMPLATE_PLACEHOLDER_RESERVED`

## The callback method
The custom processing done by the custom placeholder activator is done by the `callback` method passed to
the `register` method.
It receives the following arguments:

* `matches` is the array of matched pattern for each replacement. The order of contents is the following:
  1. the whole matched string
  2. the placeholder activator (eg. `$` )
  3. the placeholder (eg. for `{$lorem}` you will have `lorem`)
  4. the inner content if the syntax expect a closing placeholder.
  
* `items` is the object with key/value pairs given to the template.
* `translations` is the key/value pairs with translation labels applied to the current template.

The method must return the computed text that will replace the current placeholder.

## Example of custom activators
Example: `custom-placeholders.html`

Javascript:
```javascript
x.register( '%', function(matches, items, translations){
     return '<a role="button" class="btn btn-primary">' + matches[2] + '</a>';
}, XTEMPLATE_PRIORITY_AFTER_VAR);
```

Template content:
```text
{%Hello world!}
```

Output:
```html
<a role="button" class="btn btn-primary">Hello world!</a>
```

# XTemplate Configuration Object
When you initialize an XTemplate object, you can optionally pass a configuration object to it. Follow the properties that you can set for it:

| *property* | *type* | *default value* | *description* |
|------------|:-------:|:-------------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `debug` | `boolean` | `false` | If `true` show some debug information in the console area |
| `lang` | `string` | `en_US` | Defines which is the default language |
| `langPath` | `string` | `false` | Set the path to the translations file (it can be relative, absoulte or external domain if CORS is allowed). The final file path is defined as: `<langPath>`/`<lang>`/`<translation-file-name>`. The `<translation-file-name>` must be defined in `data-lang` attribute of the template section. |
| `autotranslate` | `boolean` | `false` | If `true` the call to `setLang` method will raise an automatic translation of contents. |
| `replaceContents` | `boolean` | `false` | If `true` and  is defined the `intoId` argument of the `apply` method, then it will replace the content in the `intoId` area. |
| `syncLoad` | `boolean` | `false` | If `true` the translation strings loading process will be executed in synchronous mode. **Note:** before set it to `true`, please take a look to the [XMLHttpRequest Standard](https://xhr.spec.whatwg.org/#sync-warning) |

An example initialization with Configuration object would be the following.

```javascript
var x = new Xtemplate({
    debug: true,
    langPath: 'translations/',
    lang: 'en_US',
    autotranslate: true,
    replaceContents: false,
    syncLoad: true
});
```

**Note** To work properly, `autotranslate` when set to `true`, expect that the `intoId` argument of `apply` method must be defined.

# Templates Syntax
The template syntax is really easy, to understand and remember:
- `{$variable}` Reference to a variable
- `{?variable}` ... `{!variable}` Show the block only if the variable exists
- `{#subtemplate}` Reference to a subtemplate
- `{=expression}` Executes a javascript expression a method call or a complex code in a safe context (XSS injection is not possible)
- `{:translation-label}` Apply the translations according to the configuration (see [Produce multilingual contents](#produce-multilingual-contents) for further details)

## Example of `{$variable}` usage

Example: `hello-name.html`

HTML:
```html
<script type="text/x-template" id="hello-name-template">
    <div>
        Hello {$name}!
    </div>
</script>
<div id="my-section">This text will be replaced</div> 
```

Javascript:
```javascript
var x = new Xtemplate(),
    row = {
      name: 'Diego'
    },
    output = x.apply('#hello-name-template', row);

$('#my-section').html(output);
```

Result will be:
```html
<div id="my-section">
  <div>
      Hello Diego!
  </div>
</div> 
```

## Example of `{?condition}` usage
Examples: `hello-name-country-1.html` ([demo](http://diegolamonica.info/demo/xtemplate/hello-name-country-1.html)), `hello-name-country-2.html` ([demo](http://diegolamonica.info/demo/xtemplate/hello-name-country-2.html)), `conditions.html` ([demo](http://diegolamonica.info/demo/xtemplate/conditions.html))

The `{?...}` introduces an existence block condition ended by `{!...}`

The `{?^...}` introduces a non-existence block condition ended by `{!^...}`

HTML:
```html
<script type="text/x-template" id="hello-name-template">
    <div>
        Hello {$name}{?country}, you are from {$country}{!country}!
    </div>
</script>
<div id="my-section">This text will be replaced</div> 
```

Javascript:
```javascript
var x = new Xtemplate(),
    row = {
      name: 'Diego'
    },
    output = x.apply('#hello-name-template', row);

$('#my-section').html(output);
```

Output:
```html
<div id="my-section">
  <div>
      Hello Diego!
  </div>
</div> 
```

But changing the `row` object as follows:
```javascript
row = {
  name:     'Diego', 
  country:  'Italy'
}
```
will produce the following output:
```html
<div id="my-section">
  <div>
      Hello Diego, you are from Italy!
  </div>
</div> 
```

## Working with `{#subtemplate}`

- **Basic syntax `{#subtemplate}`**  
  `subtemplate` is the identifier of another template.  
  The placeholder will be replaced with the subtemplate having the given `id`.
  The subtemplate will inherit the base data from the current template.
  
- **Advanced syntax `{#subtemplate, subvariable=1, anotehrvariable="hello", anothervaraible=variablename}`**  
  In the advanced syntax you can pass one or more runtime defined variables that will be merged in the base object
  and have limited scope to the subtemplate element.
  An argument value will be threat as:
  - `string` if it starts with `"` or `'` and will end with the same character.
  - `number` if it is a sequence of numbers optionally followed by a dot and by one or more numbers (in example `100` or `100.01`)
  - `variable` if it is not a string and not a number, then it would be a key of the current template

- **Extended Advanced syntax is `{#subtemplate, +objectData1, +objectData2, anothervaraible="variable value"}`**  
  The same as the **Advanced syntax**, but when an argument is prefixed by `+` the parser will try to do several operations:
  - if `objectData1` is an array and is the only argument passed to the subtemplate, then the informations avaliable on
    subtemplate will be only the ones into `objectData1` and it will loop the array using `subtemplate` as given template.
  - if `objectData1` is an array, but it is not the lonely argument passed to the subtemplate, then the data is ignored.
  - if `objectData1` is an object, it will be merged with the base object data.
  - if multiple objects were defined int the subtemplate call (like in the example above), all them will be merged together.
    **Duplicate keys will be overwritten by the last in order of declaration.**
  
### Basic Syntax example
Example: `subtemplate-basic.html` ([demo](http://diegolamonica.info/demo/xtemplate/subtemplate-basic.html))

HTML:
```html
<script type="text/x-template" id="country-template">
        and I am from {$country}
    </script>
    <script type="text/x-template" id="name-template">
        Hello, my name is {$name}
        {#country-template}
    </script>
    <div id="my-section"></div>
```

Javascript:
```javascript
var x = new Xtemplate(),
    row = {
        name: 'Diego',
        country: 'Italy'
    },
    output = x.apply('#name-template', row);

$('#my-section').html(output);
```

Output:
```html
<div id="my-section">
    Hello, my name is Diego
    
    and I am from Italy

</div>
```

### Extended Syntax
Example: `subtemplate-advanced.html` ([demo](http://diegolamonica.info/demo/xtemplate/subtemplate-advanced.html))

HTML:
```html
<script type="text/x-template" id="name-template">
  Hello, my name is {$name}
  {#country-template live=country,age="38"}
</script>

<script type="text/x-template" id="country-template">
  actually I live in {$live} and I'm {$age} years old
</script>

<div id="my-section">This text will be replaced</div>
```

Javascript:
```javascript
var x = new Xtemplate(),
    row = {
        name:       'Diego',
        country:    'Italy'
    },
    output = x.apply('#name-template', row);

$('#my-section').html(output);
```

Output:
```html
<div id="my-section">
  Hello, my name is Diego
  
  actually I live in Italy and I'm 38 years old
</div>
```

### Extended Advanced Syntax
Example: `invoice.html` ([demo](http://diegolamonica.info/demo/xtemplate/invoice.html))

Due the complexity of the explanation, it's better to see it in action in the [http://diegolamonica.info/demo/xtemplate/invoice.html](invoice example)

## Callback argument usage example
Examples: `callback-example.html` ([demo](http://diegolamonica.info/demo/xtemplate/callback-example.html))

HTML:
```html
<script type="text/x-template" id="country-template">
    and I am from {$country}
</script>
<script type="text/x-template" id="name-template">
    Hello, my name is {$name}
    {#country-template}<br />
</script>
<div id="my-section"></div>
```

Javascript:
```javascript
  function myDataCallback(row) {

      var names = {
          John: 'London',
          Aaron: 'New York City',
          Anita: 'Spain'
      }

      if (names[row.name] !== undefined) {
          row.country = names[row.name];
      }
      return row;
  }

  var x = new Xtemplate(),
      rows = [
          { name: 'Diego', country: 'Italy' },
          { name: 'John'},
          { name: 'Aaron'},
          { name: 'Anita'}
      ],
      output = x.apply('#name-template', rows, myDataCallback);

  $('#my-section').html(output);
```

Output:
```html
  Hello, my name is Diego
  and I am from Italy
  <br />
    
  Hello, my name is John
  and I am from London
  <br />
    
  Hello, my name is Aaron
  and I am from New York City
  <br />
    
  Hello, my name is Anita
  and I am from Spain
  <br />
```

## Using `{=expression}`
Examples: `functions.html` ([demo](http://diegolamonica.info/demo/xtemplate/functions.html))

The Expression placeholder is able to evaluate any Javascript content with some known limitations:
- The following methods/objects are disabled due security concerns:
  - `setTimeout`
  - `setInterval`
  - `XMLHttpRequest`
  - `addEventListner`
- You cannot use curly brackets in the expression ( it's wrong to do: `{='hello{'+name+'}'}`, 
  raising an unpredictable result, use instead the unicde value `\u007b` (or `&#123;`) for the opened bracket 
  and `\u007d` (or `&#125`) for the closed bracket.

HTML:
```html
<script type="text/x-template" id="functions-template">
    <pre>
        Math: 3 + 4 = {=3+4}
        Check XMLHttpRequest : {=typeof(document.XMLHttpRequest)}
        Check XMLHttpRequest : {=typeof(XMLHttpRequest)}

        var1+var2 : {=var1+var2}

        {=window.location.href} 
    </pre>
</script>

<div id="my-section"></div>
```

Javascript:
```javascript
var x = new Xtemplate(true),

    output = x.apply('#functions-template', {
        var1: 1,
        var2: 3
    });

$('#my-section').html(output);
```

Output:
```html
<pre>
Math: 3 + 4 = 7
Check XMLHttpRequest : undefined
Check XMLHttpRequest : object

var1+var2 : 4

http://localhost:63342/XTemplate/examples/functions.html 
</pre>
```

# Produce multilingual contents
XTempalte allows you to manage multiple languages for your contents.

**Note:** because since the *v 1.5* the translation strings loading is performed in an async process, the method apply should be
invoked using the `intoId` parameter too.  
However you can force the loading process to run in sync mode setting the option `syncLoad` to `true` in the configuration object.  
Before go by this way, please take a look to the [XMLHttpRequest Standard](https://xhr.spec.whatwg.org/#sync-warning)

## XTemplate translation labels binding 
Using the `data-lang` attribute in your `x-template` fragment, you can set the name of the file that keeps the translation labels:

```html 
<script type="text/x-template" id="my-template" data-lang="translations.json">
   <div>
     {:hello} {$name}!
     {:theCountry}
  </div>
</script> 
 ```

## XTemplate translation file structure
The translation file is a simple `JSON` file with one or more key/value pairs:

```javascript
{
    "hello": "Ciao! Io sono",
    "theCountry": " Vivo in {$country}!"
}
```

Due the translation lables were applied before every proessing, you can put into each value some placeholder like you can see in `theCountry` translation key.

# ChangeLog

## 2015-09-12: V 1.5
- Enabled automatic translation action on setting new language
- Now translation files are loaded in async mode (better than the deprecated sync mode)
- **New:** now you can add your own placeholder activators simply
- Added new methods `register` and `unregister` to manage custom placeholder activatos
- Added new method `isTranslationReady`
- Removed some debug messages
- Added other debug messages
- Updated documentation
- Updated example file `translations.html`
- Added example file `autotranslate.html` 
- Added example file `custom-placeholders.html`

## 2015-05-26: V 1.4.1
- Corrected some typos in documentation
- Bugfix: in the `{=evaluation}` parsing, if the evaluated key is null then it was considered wrongly as undefined.

## 2015-05-25: V 1.4
- Minor improvements in the `{=expression}` evaluation placeholder
- Now subpattern arguments accepts the use of `+` (see documentation)
- jQuery defined from anonymous function initialization
- added `invoice.html` as real world example
- updated all the examples to improve comprehensiveness
- Updated the documentation

## 2015-05-21: V 1.3
- Improved the `{=expression}` evaluation making it more safer, updated docummentation
- Updated the `functions.html` example
- Bugfix on translation strings where they are not available for specific language
- Added License header in the class
- Added a minimal format to the examples (using bootstrap over CDN)
- Added fork-me link in all the examples files
- Added an index to example directory (itself built with XTemplate)

## 2015-05-19: V 1.2
- Introduced the `{:translation-label}` placeholder
- Added the configuration object
- Added `setLang` method
- Added the `translations.html` example file
- Improved the documentation

## 2015-05-15: V 1.1
- Introduced the `{=expression}` placeholder
- Added debug functionality

## 2015-05-13: V 1.0
- Some Bugfixes (thanks to [michacom](https://github.com/michacom/) contribution )
- Introduced the negative condition

## 2015-05-11: First commit

