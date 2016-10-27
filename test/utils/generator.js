
'use strict';

module.exports = function generator(input, output) {
	const length = parseInt(input.length.read().data, 10);
	const interval = parseInt(input.interval.read().data, 10);
	const emitter = index => () => {
		output.out.send({ name: index });
	};
	for (let i = 0; i < length; i += 1) {
		if (interval) {
			setTimeout(emitter(i), i * interval);
		} else {
			emitter(i)();
		}
	}
};

