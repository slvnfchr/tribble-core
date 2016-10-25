
'use strict';

/**
 * Files tree traversal module
 */


'use strict';

const fs = require('fs');
const path = require('path');
const File = require('./file');

const ignore = /node_modules|LICENSE/i;

module.exports = function walker(input, output) {
	const base = input.base.read().data; // base path
	const mask = new RegExp(input.mask.read().data, 'i'); // filename mask
	const traversed = {};

	const _getFiles = (basepath, level) => { // eslint-disable-line no-underscore-dangle
		traversed[basepath] = false;
		const current = level || 0;
		fs.readdir(basepath, (err, files) => {
			files
				.filter(name => !ignore.test(name))
				.filter(name => mask.test(name))
				.map(name => path.resolve(basepath, name))
				.map(filepath => Object.assign({ filepath }, { stats: fs.statSync(filepath) }))
				.forEach((file) => {
					if (file.stats.isFile()) {
						output.out.send(new File({
							base,
							fullPath: file.filepath,
							level: current,
						}));
					} else if (file.stats.isDirectory()) {
						_getFiles(file.filepath, current + 1);
					}
				});
			traversed[basepath] = true;
			if (Object.keys(traversed).map(key => traversed[key]).filter(value => !value).length === 0) {
				output.out.send(null); // send null IP to close connection
			}
		});
	};
	_getFiles(base);

};