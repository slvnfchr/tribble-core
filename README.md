# tribble-plugin

Tribble plugin core module

## Install

```bash
$ npm install tribble-plugin --save
```

## Usage

### plugin(input, ouput, process)

This method creates a plugin that can be installed with [tribble](https://github.com/slvnfchr/tribble)'s install command
This method requires three parameters :
- `input` : array of input files types (taken from _plugin.types.*_)
- `output` : output file type (taken from _plugin.types.*_)
- `process` : process function (_function(file) { ... }_)

```js

const plugin = require('tribble-plugin');

module.exports = plugin(input, ouput, process);

```

### plugin.types

Map of content-types by extension based on [mime-types](https://github.com/jshttp/mime-types) module's own _types_ object
