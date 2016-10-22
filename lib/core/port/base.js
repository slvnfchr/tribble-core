
'use strict';

/**
 * Base port class
 * @class Port
 */

const IP = require('../ip');

function Port(component, name) {
	this.component = component;
	this.name = name;
	this.connection = null;
}

Port.prototype.createIP = function createIP(data) {
	return new IP(data);
};

module.exports = Port;
