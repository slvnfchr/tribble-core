
'use strict';

/**
 * Worker base class
 */

const handler = require(process.argv[2]);
const Connection = require('./connection/base');
const Component = require('./component');
const InputPort = require('./port/input');
const OutputPort = require('./port/output');

const component = new Component();
let port;
if (process.env.outports !== '') { // component to component connexion
	process.env.outports.split(',').forEach((name) => {
		port = new OutputPort(component, name);
		port.connection = new Connection();
		// forward sent ip to parent process
		port.connection.addListener(Connection.events.ENQUEUE_AFTER, (ip) => {
			process.send({ type: 'out', port: name, data: ip.data });
		});
	});
}
if (process.env.inports !== '') {
	process.env.inports.split(',').forEach((name) => {
		port = new InputPort(component, name);
		port.connection = new Connection();
		// forward read ip to parent process
		port.connection.addListener(Connection.events.DEQUEUE, (ip) => {
			process.send({ type: 'in', port: name, data: ip.data });
		});
	});
}

process.on('message', (data) => {
	if (data === null) {
		handler.call(component);
		process.send(null);
	} else if (data.type === 'in') {
		const inport = component.inports[data.port];
		inport.connection.putData(inport.createIP(data.data));
	}
});
