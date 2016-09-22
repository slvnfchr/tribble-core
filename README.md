# tribble-plugin

Tribble plugin core module

## Install

```bash
$ npm install tribble-plugin --save
```

## Usage

### plugin(input, ouput, type, process)

This method creates a plugin that can be installed with [tribble](https://github.com/slvnfchr/tribble)'s install command

This method requires the following parameters :
- `input` : input files media type(s) (_plugin.mediatypes.*_)
- `output` : output file media type(s) (_plugin.mediatypes.*_)
- `type` : the plugin type (_plugin.types.*_)
- `process` : process function (_function(input, output, error) { ... }_)

```js

const plugin = require('tribble-plugin');

module.exports = plugin(
	[plugin.mediatypes.scss, plugin.mediatypes.sass], // input file media types
	plugin.mediatypes.css, // output file media type
	plugin.types.PREPROCESSOR, // plugin type
	function(input, output, error) { // plugin core processing function
		const file = input.read(); // file is a File instance
		// ...
		if(err) {
			error.write(err);
		} else {
			output.write(result);
		}
	}
);

```

File instances have the following properties :
- base : the base path of the distribution the file belongs to
- path : the path of the file relative to the distribution's root
- fullPath : the full path of the file
- type : the media type of the file (_plugin.mediatypes.*_)
- data : the file contents for non binary files




### plugin.types

Object with types of plugins :
- plugin.types.PREPROCESSOR (ex: SASS, Coffeescript)
- plugin.types.TRANSFORM (any transformation plugin, order independant)
- plugin.types.POSTPROCESSOR (ex: postCSS, r.js)
- plugin.types.AGGREGATOR (ex: templating engine)
- plugin.types.MINIFIER (ex: closure compiler)
- plugin.types.PACKAGER (ex: zip packaging)


### plugin.mediatypes

Map of mediatypes by extension based on [mime-db](https://github.com/jshttp/mime-db) (ex: plugin.mediatypes.scss)
