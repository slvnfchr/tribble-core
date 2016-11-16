
'use strict';

/**
 * Worker base class
 */

const handler = require(process.argv[2]);
const timeout = process.argv[3];
const Connection = require('./connection/Component');
const IIPConnection = require('./connection/IIP');
const Component = require('./Component');
const Input = require('./port/Input');
const Output = require('./port/Output');

const component = new Component(handler, timeout);
let port;
if (process.argv[6] && process.argv[6] !== '') { // component to component connexion
	process.argv[6].split(',').forEach((name) => {
		port = new Output(component, name);
		port.connection = new Connection();
		port.connection.upComponents.push(component);
		// forward sent ip to parent process
		port.connection.addListener(Connection.events.ENQUEUE, (ip) => {
			if (process.connected) process.send({ type: 'out', port: name, data: ip.data });
		});
	});
}
const iips = (process.argv[4] && process.argv[4] !== '') ? process.argv[4].split(',') : [];
if (process.argv[5] && process.argv[5] !== '') {
	process.argv[5].split(',').forEach((name) => {
		port = new Input(component, name);
		if (iips.indexOf(name) !== -1) {
			port.connection = new IIPConnection();
		} else {
			port.connection = new Connection();
			port.connection.downComponent = component;
		}
		// forward read ip to parent process
		port.connection.addListener(Connection.events.DEQUEUE, () => {
			if (process.connected) process.send({ type: 'in', port: name });
		});
	});
}
component.addListener(Component.events.STATE_CHANGE, () => {
	if (component.status === Component.status.DONE && process.connected) process.send({ type: 'timeout' });
});
component.initialize();

process.on('message', (data) => {
	if (data.type === 'activate') {
		component.activate();
		component.execute();
	} else if (data.type === 'close') {
		const inport = component.input[data.port];
		inport.connection.close();
	} else if (data.type === 'in') {
		const inport = component.input[data.port];
		inport.connection.putData(data.data);
	}
});
