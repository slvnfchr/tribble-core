
'use strict';

/**
 * Tribble plugin generic class
 */

const util = require('util');
const path = require('path');
const stream = require('stream');
const constants = require('./constants');
const Walker = require('./walker');

function Plugin(input, output, type, process) {
	if (input === undefined) throw new Error('Input file types should be specified');
	if (output === undefined) throw new Error('Output file media type should be specified');
	stream.Transform.call(this, { objectMode: true });
	this.input = { mediatypes: input };
	this.output = { mediatypes: output };
	if (!Array.isArray(input)) Object.assign(this.input, { mediatypes: [input] });
	if (!Array.isArray(output)) Object.assign(this.output, { mediatypes: [output] });
	if (this.input.mediatypes.length === 0) throw new Error('Input file types should be specified');
	if (this.output.mediatypes.length === 0) throw new Error('Output file media type should be specified');
	if (this.input.mediatypes.filter(mediatype => Object.keys(constants.extensions).indexOf(mediatype) === -1).length > 0) throw new Error('Input file media types should be a plugin.mediatypes.* value');
	if (this.output.mediatypes.filter(mediatype => Object.keys(constants.extensions).indexOf(mediatype) === -1).length > 0) throw new Error('Output file media types should be a plugin.mediatypes.* value');
	Object.assign(this.input, { extensions: this.input.mediatypes.reduce((arr, mediatype) => arr.concat(constants.extensions[mediatype]), []) });
	Object.assign(this.output, { extensions: this.output.mediatypes.reduce((arr, mediatype) => arr.concat(constants.extensions[mediatype]), []) });
	this.type = type || constants.types.TRANSFORM;
	if (Object.keys(constants.types).filter(key => constants.types[key] === this.type).length !== 1) throw new Error('Plugin type should be a plugin.types.* value');
	this.priority = constants.priorities.indexOf(this.type);
	if (process === undefined) throw new Error('Process function should be specified');
	this.process = process;
}
util.inherits(Plugin, stream.Transform);

Plugin.create = function create(input, output, type, process) {
	const instance = new Plugin(input, output, type, process);
	return instance;
};

Plugin.prototype.getSources = function getSources(outputPath) {
	const ext = path.extname(outputPath);
	const filename = ext ? path.basename(outputPath, ext) : '*';
	return Walker.create(
		ext ? path.dirname(outputPath) : outputPath,
		this.input.extensions.map(extension => `${filename}.${extension}`)
	);
};

Plugin.prototype._transform = function transform(file, encoding, done) { // eslint-disable-line no-underscore-dangle, max-len
	if (this.type !== constants.types.AGGREGATOR) {
		this.process(
			{ read: () => file },
			{ write: (result) => {
				this.push(result);
				done();
			} },
			{ write: () => done() }
		);
	} else {
		// TODO
		// wait for previous streams to complete
	}
};

module.exports = Plugin;
