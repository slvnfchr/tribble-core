
'use strict';

/**
 * Base port class
 * @class Port
 */

const IP = require('../ip');

class Port {

	constructor(component, name) {
		this.component = component;
		this.name = name;
		this.connection = null;
	}

	createIP(data) {
		const ip = new IP(data);
		ip.owner = this.component;
		return ip;
	}

}

module.exports = Port;
