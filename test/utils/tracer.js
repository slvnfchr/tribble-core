
'use strict';

module.exports = function tracer() {
	const input = this.getInput('in');
	const ip = input.read();
	console.log('->', ip.data);
};

