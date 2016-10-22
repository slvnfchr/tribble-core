
'use strict';

module.exports = function generator() {
	const input = this.getInput('length');
	const output = this.getOutput('out');
	const length = parseInt(input.read().data, 10);
	const emitter = index => () => {
		output.send(output.createIP({ name: `packet${index}` }));
	};
	for (let i = 0; i < length; i += 1) {
		setTimeout(emitter(i), i * 100);
	}
};

