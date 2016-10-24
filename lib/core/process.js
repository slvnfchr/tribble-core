
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
if (process.env.output !== '') { // component to component connexion
	process.env.output.split(',').forEach((name) => {
		port = new OutputPort(component, name);
		port.connection = new Connection();
		// forward sent ip to parent process
		port.connection.addListener(Connection.events.ENQUEUE_AFTER, (ip) => {
			process.send({ type: 'out', port: name, data: ip.data });
		});
	});
}
if (process.env.input !== '') {
	process.env.input.split(',').forEach((name) => {
		port = new InputPort(component, name);
		port.connection = new Connection();
		// forward read ip to parent process
		port.connection.addListener(Connection.events.DEQUEUE, (ip) => {
			process.send({ type: 'in', port: name, data: ip.data });
		});
	});
}

process.on('test', (data) => { // for testing purpose
	process.send(data);
});

process.on('message', (data) => {
	if (data === null) {
		handler.call(component, component.input, component.output);
		process.send(null);
	} else if (data.type === 'in') {
		const inport = component.input[data.port];
		inport.connection.putData(inport.createIP(data.data));
	} else if (data.type === 'close') {
		const inport = component.input[data.port];
		inport.connection.close();
	}
});
