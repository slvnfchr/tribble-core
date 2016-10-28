
'use strict';

/**
 * Output port class
 * @class OutputPort
 */

const Base = require('./Base');

class Output extends Base {

	constructor(component, name) {
		super(component, name);
		const ports = {};
		ports[name] = this;
		if (component) Object.assign(component.output, ports);
	}

	send(ip) {
		return this.connection.putData(ip);
	}

}

module.exports = Output;
