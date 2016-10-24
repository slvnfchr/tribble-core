
'use strict';

module.exports = function tracer(input) {
	const ip = input.in.read();
	process.emit('test', ip);
};

