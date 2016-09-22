
'use strict';

/**
 * File class
 */

const path = require('path');
const constants = require('./constants');

function File(properties) {
	if (properties === undefined || !properties.fullPath) throw new Error('A fullPath property should be specified to instantiate a File object');
	this.base = properties.base || null;
	this.path = properties.path || null;
	this.fullPath = properties.fullPath || null;
	this.type = properties.fullPath ? constants.mediatypes[path.extname(properties.fullPath).substring(1)] : null;
	this.name = properties.name || (this.fullPath ? path.basename(this.fullPath) : null);
	this.data = null;
}

File.create = function create(properties) {
	const instance = new File(properties);
	return instance;
};

module.exports = File;
