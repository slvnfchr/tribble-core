
'use strict';

const path = require('path');
const Component = require('./core/component');
const Graph = require('./core/graph');
const Connection = require('./core/connection/component');
const IIPConnection = require('./core/connection/iip');
const IP = require('./core/ip');
const Input = require('./core/port/input');
const Output = require('./core/port/output');
const File = require('./file/file');

module.exports = {
	Component,
	Graph,
	Connection,
	IIPConnection,
	IP,
	Input,
	Output,
	file: {
		File,
		walker: () => new Component(path.resolve(__dirname, './file/walker')),
		reader: () => new Component(path.resolve(__dirname, './file/reader')),
	},
};
