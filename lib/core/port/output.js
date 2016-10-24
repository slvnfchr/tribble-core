
'use strict';

/**
 * Output port class
 * @class OutputPort
 */

const Port = require('./base');

function OutputPort(component, name) {
	Port.call(this, component, name);
	const ports = {};
	ports[name] = this;
	if (component) Object.assign(component.output, ports);
}
OutputPort.prototype = Object.create(Port.prototype);

OutputPort.prototype.send = function send(ip) {
	return this.connection.putData(ip);
};

module.exports = OutputPort;
