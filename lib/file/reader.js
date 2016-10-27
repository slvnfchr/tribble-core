
'use strict';

/**
 * File reader component
 */


'use strict';

const fs = require('fs');
const File = require('./file');

module.exports = function reader(input, output) {
	const ip = input.in.read();
	fs.readFile(ip.data.fullPath, { encoding: 'utf8' }, (err, data) => {
		ip.data.contents = ip.data.mediatype === File.mediatypes.json ? JSON.parse(data) : data;
		output.out.send(ip);
	});
};
