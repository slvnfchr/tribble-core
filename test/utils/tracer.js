
'use strict';

module.exports = function tracer(input) {
	const ip = input.in.read();
	if (ip) process.emit('test', ip);
};

