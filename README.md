# tribble-core

Tribble core classes and components based on flow-based programming paradigm.  
All classes are written in ES2015 and designed for Node.js runtime (with no dependencies).

## Core classes

- **Component** for code components defined as a function, a local module (through its path)
- **Connection** to link components
- **Graph** to describe a set of components and connections forming a network
- **IP** for information packets (IP) or chunks of data flowing between components through connections
- **IIPConnection** for initial IP connections used to initialize a component with specific parameters
- **Input** and **Output** for components input and output ports

## File processing

- **File** for file IP with specific properties (fullPath, mediatype...)
- **walker** to get a component for tree traversal with base path and mask as inputs, File instance as output
- **reader** to get a component for file reading that appends file contents to incoming file IPs

## Components

Components can be defined with a function, a local module (through its path) or a remote module (URL)

### Function

```js

const core = require('tribble-core');
const component = new core.Component((input, ouput) => {
	const data = input.read();
	Object.assign(data, { newproperty: property });
	ouput.send(data);
});

```
### Local module

```js

const core = require('tribble-core');
const component = new core.Component('./component');
```

The corresponding _component.js_ should be as follow :

```js
module.exports = (input, ouput) => {
	const data = input.read();
	Object.assign(data, { newproperty: value });
	ouput.send(data);
};

```
