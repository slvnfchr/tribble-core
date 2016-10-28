
'use strict';

/**
 * Input port class
 * @class InputPort
 */

const Base = require('./Base');

class Input extends Base {

	constructor(component, name) {
		super(component, name);
		const ports = {};
		ports[name] = this;
		if (component) Object.assign(component.input, ports);
	}

	read() {
		const ip = this.connection.getData();
		return ip;
	}

}

module.exports = Input;
