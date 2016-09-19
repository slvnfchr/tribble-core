
'use strict';

/**
 * Tribble plugin generic class
 */

const util = require('util');
const stream = require('stream');
const mime = require('mime-types');

function PluginStream(plugin) {
	stream.Transform.call(this, { objectMode: true });
	this.plugin = plugin;
}
util.inherits(PluginStream, stream.Transform);

PluginStream.create = function create(plugin) {
	const instance = new PluginStream(plugin);
	return instance;
};

PluginStream.prototype._transform = function transform(data, encoding, done) { // eslint-disable-line no-underscore-dangle, max-len
	this.plugin.process(data, (result) => {
		this.push(result);
		done();
	});
};

PluginStream.prototype._flush = function flush(done) { // eslint-disable-line no-underscore-dangle
	done();
};


function Plugin(input, output, process) {
	if (input === undefined) throw new Error('input file types should be specified');
	if (!Array.isArray(input)) throw new Error('input file types should be an array');
	if (Array.isArray(input) && input.length === 0) throw new Error('input file types array should not be empty');
	if (Array.isArray(input) && input.length > 0 && input.filter(type => mime.extensions[type] === undefined).length > 0) throw new Error('input file types array should be plugin.types.* value');
	if (output === undefined) throw new Error('output file type should be specified');
	if (Object.keys(mime.extensions).indexOf(output) === -1) throw new Error('output file type should be a plugin.types.* value');
	if (process === undefined) throw new Error('process function should be specified');
	if (typeof process !== 'function') throw new Error('process should be a function');
	this.input = input;
	this.output = output;
	this.process = process;
}

Plugin.create = function create(input, output, process) {
	const instance = new Plugin(input, output, process);
	return instance;
};

Plugin.prototype.getStream = function getStream() {
	return PluginStream.create(this);
};


module.exports = Plugin.create;
module.exports.types = mime.types;
