
'use strict';

/**
 * Files tree traversal stream module
 */

const util = require('util');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const readdirp = require('readdirp');
const File = require('./file');

function Walker(base, filter) {
	stream.Readable.call(this, { objectMode: true });
	if (filter !== undefined) { // directory path with glob filter
		this.base = base;
		this.filter = !Array.isArray(filter) ? [filter] : filter;
	} else { // single file path
		this.base = path.dirname(base);
		this.filter = [path.basename(base)];
	}
}
util.inherits(Walker, stream.Readable);

Walker.create = function create(source, filter) {
	const instance = new Walker(source, filter);
	return instance;
};

Walker.prototype.setup = function setup() {
	this.initialized = true;
	const walk = readdirp({ root: this.base, fileFilter: this.filter });
	walk.on('data', (file) => {
		const chunk = new File(Object.assign({ base: this.base }, file));
		if (chunk.type.match(/^(text\/|application\/javascript)/)) {
			fs.readFile(chunk.fullPath, 'utf8', (err, data) => {
				Object.assign(chunk, { data });
				this.push(chunk);
			});
		} else {
			this.push(chunk);
		}
	}).on('end', () => {
		this.push(null);
	});
};

Walker.prototype._read = function _read() { // eslint-disable-line no-underscore-dangle
	if (!this.initialized) this.setup();
};

module.exports = Walker;
