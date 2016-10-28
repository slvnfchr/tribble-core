
'use strict';

/**
 * File reader component
 */


'use strict';

const fs = require('fs');
const File = require('./File');

module.exports = function reader(input, output) {
	const file = input.read();
	fs.readFile(file.fullPath, { encoding: 'utf8' }, (err, data) => {
		file.contents = file.mediatype === File.mediatypes.json ? JSON.parse(data) : data;
		output.send(file);
	});
};
