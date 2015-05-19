# XTemplate
A Simple Javascript library to manage HTML Fragments templates

**To see XTemplate in action download the package and open files in examples directory in your browser**

## ChangeLog

### 2015-05-19: V 1.2
- Introduced the `{:translation string}` placeholder
- Added the configuration object
- Added `setLang` method
- Added the `translations.html` example file
- Improved the documentation

### 2015-05-15: V 1.1
- Introduced the `{=expression}` placeholder
- Added debug functionality

### 2015-05-13: V 1.0
- Some Bugfixes (thanks to [michacom](https://github.com/michacom/) contribution )
- Introduced the negative condition

### 2015-05-11: First commit

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

# XTemplate Function Reference
- *`apply (templateId, rows, [[callback], appendTo])`*  
  Uses the template defined as `templateId` in conjunction with the data given in `rows` argument. If `appendTo` is not defined the method will output the computed string.  
  **`rows`** can be either an object or an array of objects. However he **must** contain at least an object else the given output will be an empty string.  
  **`callback`** is an optional method that will manipulate each element defined in `rows`. It expect a single argument (the single row) and will returns the altered version of the row. Default value is `undefined`  
  **`appendTo`** is the section of the template where to append the computed template.

- *`applyString (templateString, items, [callback])`*  
  The same as `apply` method but using directly a string.

- *`setLang(langName)`
  Set the lang to the new one. It will update the translation strings loading the files from the defined source (see [Produce multilingual contents](readme.md#user-content-produce-multilingual-contents) section).

# Templates Syntax

The template syntax is really easy, to understand and remember:
- `{$variable}` Reference to a variable
- `{?variable}` ... `{!variable}` Show the block only if the variable exists
- `{#subtemplate}` Reference to a subtemplate
- `{=expression}` Executes a javascript expression a method call or a complex code in a safe context (XSS injection is not possible)
- `{:translation string}` Apply the translations according to the configuration (see [Produce multilingual contents](readme.md#user-content-produce-multilingual-contents) for further details)

## Example `{$variable}` usage

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

## Example *`{?variable}`* usage
Examples: `hello-name-country-1.html`, `hello-name-country-2.html`, `conditions.html`

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

- Basic syntax `{#subtemplate}` where `subtemplate` is the identifier of another template.
- Extended syntax is `{#subtemplate, subvariable=1, anotehrvariable="hello", anothervaraible=variablename}`

### Basic Syntax example
Example: `subtemplate-basic.html`

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
Example: `subtemplate-advanced.html`

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

## Callback argument usage example
Examples: `callback-example.html`

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
Examples: `functions.html`

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

## XTemplate Configuration Object
When you initialize an XTemplate object, you can optionally pass a configuration object to it. Follow the properties that you can set for it:

| *property* | *type* | *default value* | *description* |
|------------|:-------:|:-------------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `debug` | `boolean` | `false` | If `true` show some debug information in the console area |
| `lang` | `string` | `en_US` | Defines which is the default language |
| `langPath` | `string` | `false` | Set the path to the translations file (it can be relative, absoulte or external domain if CORS is allowed). The final file path is defined as: `<langPath>`/`<lang>`/`<translation-file-name>`. The `<translation-file-name>` must be defined in `data-lang` attribute of the template section. |

```javascript
var x = new Xtemplate({
    debug: true,
    langPath: 'translations/',
    lang: 'en_US'
});
```

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