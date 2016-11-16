
'use strict';

let interval;

module.exports = function copier(input, output) {
	const ip = input.in.read();
	if (interval === undefined) interval = parseInt(input.interval.read().data, 10);
	if (interval) {
		setTimeout(() => output.out.send(ip), interval);
	} else {
		output.out.send(ip);
	}
};

