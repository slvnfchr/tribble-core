
'use strict';

/**
 * Input port class
 * @class InputPort
 */

const Port = require('./base');

function InputPort(component, name) {
	Port.call(this, component, name);
	const ports = {};
	ports[name] = this;
	if (component) Object.assign(component.inports, ports);
}
InputPort.prototype = Object.create(Port.prototype);

InputPort.prototype.read = function read() {
	const ip = this.connection.getData();
	return ip;
};

module.exports = InputPort;
