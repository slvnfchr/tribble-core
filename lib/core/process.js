
'use strict';

/**
 * Worker base class
 */

const handler = require(process.argv[2]);
const Connection = require('./connection/Base');
const Component = require('./Component');
const Input = require('./port/Input');
const Output = require('./port/Output');

const component = new Component(handler);
let port;
if (process.argv[4] && process.argv[4] !== '') { // component to component connexion
	process.argv[4].split(',').forEach((name) => {
		port = new Output(component, name);
		port.connection = new Connection();
		// forward sent ip to parent process
		port.connection.addListener(Connection.events.ENQUEUE, (ip) => {
			process.send({ type: 'out', port: name, data: ip.data });
		});
	});
}
if (process.argv[3] && process.argv[3] !== '') {
	process.argv[3].split(',').forEach((name) => {
		port = new Input(component, name);
		port.connection = new Connection();
		port.connection.addListener(Connection.events.ENQUEUE, () => {
			if (component.status === Component.status.ACTIVE) {
				while (port.connection.hasData()) {
					component.execute();
				}
			}
		});
		// forward read ip to parent process
		port.connection.addListener(Connection.events.DEQUEUE, () => {
			process.send({ type: 'in', port: name });
		});
	});
}
component.initialize();

process.on('message', (data) => {
	if (data.type === 'activate') {
		component.activate();
		component.execute();
	} else if (data.type === 'in') {
		const inport = component.input[data.port];
		inport.connection.putData(data.data);
	}
});
