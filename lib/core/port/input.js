
'use strict';

/**
 * Input port class
 * @class InputPort
 */

const Port = require('./base');

class InputPort extends Port {

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

module.exports = InputPort;
