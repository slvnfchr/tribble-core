
'use strict';

/**
 * Worker base class
 */

const handler = require(process.argv[2]);
const Connection = require('./connection/base');
const Component = require('./component');
const InputPort = require('./port/input');
const OutputPort = require('./port/output');

const component = new Component(handler);
let port;
if (process.argv[4] && process.argv[4] !== '') { // component to component connexion
	process.argv[4].split(',').forEach((name) => {
		port = new OutputPort(component, name);
		port.connection = new Connection();
		// forward sent ip to parent process
		port.connection.addListener(Connection.events.ENQUEUE_AFTER, (ip) => {
			process.send({ type: 'out', port: name, data: ip.data });
		});
	});
}
if (process.argv[3] && process.argv[3] !== '') {
	process.argv[3].split(',').forEach((name) => {
		port = new InputPort(component, name);
		port.connection = new Connection();
		// forward read ip to parent process
		port.connection.addListener(Connection.events.DEQUEUE, (ip) => {
			process.send({ type: 'in', port: name, data: ip.data });
		});
	});
}
component.initialize();

process.on('message', (data) => {
	if (data === null) {
		component.execute();
		process.send(null);
	} else if (data.type === 'in') {
		const inport = component.input[data.port];
		inport.connection.putData(data.data);
	} else if (data.type === 'close') {
		const inport = component.input[data.port];
		inport.connection.close();
	}
});
