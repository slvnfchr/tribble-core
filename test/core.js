
'use strict';

const path = require('path');
const EventEmitter = require('events');
const expect = require('chai').expect;
const Port = require('../lib/core/port/Base');
const ConnectionBase = require('../lib/core/connection/Base');
const library = require('../lib/');

const Component = library.Component;
const Input = library.Input;
const Output = library.Output;
const IP = library.IP;
const IIPConnection = library.IIPConnection;
const Connection = library.Connection;
const Graph = library.Graph;

describe('Core classes', () => {

	describe('Component class', () => {

		it('Properties, default values and methods', (done) => {
			const component = new Component();
			expect(component).to.have.property('handler');
			expect(component).to.have.property('pid');
			expect(component.pid).to.equal(process.pid);
			expect(component).to.have.property('status');
			expect(component.status).to.equal(Component.status.NOT_INITIALIZED);
			expect(component).to.have.property('input');
			expect(component.input).to.be.an('object');
			expect(component).to.have.property('output');
			expect(component.output).to.be.an('object');
			expect(component).to.have.property('fork');
			expect(component.fork).to.equal(false);
			expect(component).to.respondTo('initialize');
			expect(component).to.respondTo('activate');
			expect(component).to.respondTo('execute');
			expect(component).to.respondTo('check');
			expect(component).to.respondTo('kill');
			done();
		});

		it('Status changes', (done) => {
			const component = new Component();
			let change = 0;
			component.addListener(Component.events.STATE_CHANGE, () => {
				change += 1;
			});
			component.initialize();
			expect(component.status).to.equal(Component.status.READY_TO_EXECUTE);
			component.activate();
			expect(component.status).to.equal(Component.status.ACTIVE);
			component.kill();
			expect(component.status).to.equal(Component.status.DONE);
			expect(change).to.equal(3);
			done();
		});

	});

	describe('Port class', () => {

		it('Properties and default values', (done) => {
			const component = new Component();
			const name = 'in';
			const port = new Port(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(port).to.have.property('connection');
			expect(port.connection).to.be.null;
			expect(port).not.to.respondTo('read');
			expect(port).not.to.respondTo('send');
			done();
		});

		it('Input port specific properties and methods', (done) => {
			const component = new Component();
			const name = 'in';
			const port = new Input(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(component.input[name]).to.equal(port);
			expect(port).to.respondTo('read');
			done();
		});

		it('Output port specific properties and methods', (done) => {
			const component = new Component();
			const name = 'out';
			const port = new Output(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(component.output[name]).to.equal(port);
			expect(port).to.respondTo('send');
			done();
		});

	});

	describe('Information packet', () => {

		it('Properties and default values', (done) => {
			const data = { foo: 'bar' };
			const ip = new IP(data);
			expect(ip).to.have.property('owner');
			expect(ip.owner).to.be.null;
			expect(ip).to.have.property('type');
			expect(ip.type).to.equal(IP.types.NORMAL);
			expect(ip).to.have.property('data');
			expect(ip.data).to.equal(data);
			done();
		});

	});

	describe('Connection', () => {

		it('Properties, default values and methods', (done) => {
			const connection = new ConnectionBase();
			expect(connection).to.be.instanceof(EventEmitter);
			expect(connection).to.have.property('closed');
			expect(connection.closed).to.be.false;
			expect(connection).to.have.property('upComponents');
			expect(connection.upComponents).to.be.an('array');
			expect(connection.upComponents.length).to.equal(0);
			expect(connection).to.have.property('downComponent');
			expect(connection.downComponent).to.be.null;
			expect(connection).to.have.property('pendingIPCount');
			expect(connection.pendingIPCount).to.equal(0);
			expect(connection).not.to.have.property('capacity');
			expect(connection).to.respondTo('connect');
			expect(connection).to.respondTo('close');
			expect(connection).to.respondTo('hasData');
			expect(connection).to.respondTo('getData');
			expect(connection).to.respondTo('getAllData');
			expect(connection).to.respondTo('putData');
			expect(connection).to.respondTo('purgeData');
			done();
		});

		it('IP injection and retrieval', (done) => {
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new ConnectionBase();
			let enqueue = 0;
			connection.addListener(ConnectionBase.events.ENQUEUE, () => {
				enqueue += 1;
			});
			let dequeue = 0;
			connection.addListener(ConnectionBase.events.DEQUEUE, () => {
				dequeue += 1;
			});
			expect(connection.hasData()).to.equal(false);
			expect(connection.pendingIPCount).to.equal(0);
			expect(connection.getData()).to.be.null;
			connection.putData(ip);
			expect(connection.hasData()).to.equal(true);
			expect(connection.pendingIPCount).to.equal(1);
			expect(connection.getData()).to.equal(ip);
			expect(connection.hasData()).to.equal(false);
			connection.putData(ip);
			connection.putData(ip);
			expect(connection.pendingIPCount).to.equal(2);
			expect(enqueue).to.equal(3);
			expect(dequeue).to.equal(1);
			done();
		});

		it('Capacity of connections between components', (done) => {
			const capacity = 5;
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new Connection(capacity);
			expect(connection).to.have.property('capacity');
			expect(connection.capacity).to.equal(capacity);
			for (let i = 0, n = capacity + 1; i < n; i += 1) {
				connection.putData(ip);
			}
			expect(connection.pendingIPCount).to.equal(capacity + 1);
			done();
		});

		it('Data purge should remove all contents', (done) => {
			const capacity = 10;
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new ConnectionBase(capacity);
			for (let i = 0, n = capacity; i < n; i += 1) {
				connection.putData(ip);
			}
			connection.purgeData(ip);
			expect(connection.pendingIPCount).to.equal(0);
			done();
		});

		it('Close should emit an event and purge connection contents', (done) => {
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new ConnectionBase();
			let closed = connection.closed;
			connection.addListener(ConnectionBase.events.CLOSE, () => {
				closed = connection.closed;
			});
			connection.putData(ip);
			connection.close();
			expect(connection.closed).to.be.true;
			expect(connection.getData()).to.be.null;
			expect(closed).to.be.true;
			done();
		});

		it('Ports attachment', (done) => {
			const component = new Component();
			const input = new Input(component, 'in');
			const output = new Output(component, 'out');
			const connection = new ConnectionBase();
			connection.connect(output, input);
			expect(input.connection).to.equal(connection);
			expect(output.connection).to.equal(connection);
			done();
		});

	});

	describe('Graph', () => {

		it('Methods', (done) => {
			const graph = new Graph();
			expect(graph).to.respondTo('initialize');
			expect(graph).to.respondTo('connect');
			expect(graph).to.respondTo('run');
			done();
		});

		it('Component initialization with value creates a default "in" port', (done) => {
			const component = new Component();
			const data = 12;
			const graph = new Graph();
			graph.initialize(component, data);
			expect(component.input).to.have.property('in');
			expect(component.input.in).to.have.property('connection');
			expect(component.input.in.connection).to.be.instanceof(IIPConnection);
			expect(component.input.in.read().data).to.equal(data);
			done();
		});

		it('Component initialization with object', (done) => {
			const component = new Component();
			const data = {};
			const dataKey = 'size';
			const dataValue = 12;
			data[dataKey] = dataValue;
			const graph = new Graph();
			graph.initialize(component, data);
			expect(component.input).to.have.property(dataKey);
			expect(component.input[dataKey]).to.have.property('connection');
			expect(component.input[dataKey].connection).to.be.instanceof(IIPConnection);
			expect(component.input[dataKey].read().data).to.equal(dataValue);
			done();
		});

		it('Component input port reading shorthand', (done) => {
			const component = new Component();
			const data = {};
			const dataKey = 'size';
			const dataValue = 12;
			data[dataKey] = dataValue;
			const graph = new Graph();
			graph.initialize(component, data);
			expect(component.input.read()).to.equal(dataValue);
			data.doublesize = 2 * dataValue;
			graph.initialize(component, data);
			expect(component.input.read()).to.deep.equal(data);
			done();
		});

		it('Connection between components', (done) => {
			const upComponent = new Component();
			const downComponent = new Component();
			const capacity = 10;
			const graph = new Graph();
			graph.connect(upComponent, 'out', downComponent, 'in', capacity);
			expect(upComponent.output).to.have.property('out');
			expect(upComponent.output.out.connection).to.be.instanceof(Connection);
			expect(upComponent.output.out.connection.capacity).to.equal(capacity);
			expect(upComponent.output.out.connection.downComponent).to.equal(downComponent);
			expect(downComponent.input).to.have.property('in');
			expect(upComponent.output.out.connection).to.equal(downComponent.input.in.connection);
			expect(downComponent.input.in.connection.upComponents.length).to.equal(1);
			expect(downComponent.input.in.connection.upComponents[0]).to.equal(upComponent);
			done();
		});

	});

});


[false, true].forEach((fork) => {

	describe(fork ? 'Graph execution with forked processes' : 'Graph execution on main thread', () => {

		describe('Linear graph with two components', () => {

			it('If connection capacity is not reached, no IP should be emitted', (done) => {
				const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
				upComponent.fork = fork;
				const downComponent = new Component(() => {
					expect(true).to.be.false;
				});
				const start = process.hrtime();
				const graph = new Graph();
				const count = 5;
				const interval = 0;
				const timeout = interval + 1;
				graph.initialize(upComponent, { length: count });
				graph.initialize(upComponent, { interval });
				graph.connect(upComponent, 'out', downComponent, 'in', count + 1, timeout);
				graph.run(() => {
					const elapsedTime = Math.round(process.hrtime(start)[1] / 1e6);
					expect(elapsedTime).to.be.at.least((interval * (count - 1)) + timeout);
					done();
				});
			});

			it('If connection capacity is reached, all IPs should be emitted', (done) => {
				const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
				upComponent.fork = fork;
				const graph = new Graph();
				const count = 10;
				const capacity = 5;
				const interval = 1;
				const timeout = fork ? interval + 5 : interval + 1;
				let index = 0;
				const start = process.hrtime();
				let time = start;
				const downComponent = new Component((input) => {
					const ip = input.in.read();
					const data = ip.data;
					const diffTime = Math.round(process.hrtime(time)[1] / 1e6);
					const elapsedTime = Math.round(process.hrtime(start)[1] / 1e6);
					expect(data.name).to.equal(index);
					if (index === 0) { // first IP is emitted after capacity is reached
						expect(elapsedTime).to.be.at.least((capacity - 1) * interval);
						expect(downComponent.input.in.connection.pendingIPCount).to.equal(capacity - 1);
					} else if (index > 0 && index < capacity) { // first IPs are emitted when capacity is reached
						expect(diffTime).to.be.below(interval);
					} else if (index >= capacity) { // subsequent IPs are emitted at the given interval
						expect(elapsedTime).to.be.at.least(interval * index);
					}
					index += 1;
					time = process.hrtime();
				});
				graph.initialize(upComponent, { length: count });
				graph.initialize(upComponent, { interval });
				graph.connect(upComponent, 'out', downComponent, 'in', capacity, timeout);
				graph.run(() => {
					expect(index).to.equal(count);
					done();
				});
			});

			it('If connection timeout is reached, only first IP should be emitted', (done) => {
				const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
				upComponent.fork = fork;
				const graph = new Graph();
				const count = 5;
				const interval = 10;
				const timeout = 5; // timeout below emission interval
				const downComponent = new Component((input) => {
					const ip = input.in.read();
					const data = ip.data;
					expect(data.name).to.equal(0);
				});
				graph.initialize(upComponent, { length: count });
				graph.initialize(upComponent, { interval });
				graph.connect(upComponent, 'out', downComponent, 'in', 0, timeout);
				graph.run(done);
			});
		});

		describe('Linear graph with three components', () => {

			it('Connections with no capacity and timeout', (done) => {
				const firstComponent = new Component(path.resolve(__dirname, './utils/generator'));
				firstComponent.fork = fork;
				const secondComponent = new Component(path.resolve(__dirname, './utils/copier'));
				secondComponent.fork = fork;
				const graph = new Graph();
				const count = 5;
				const interval = 5;
				const timeout = 10;
				let index = 0;
				const finalComponent = new Component((input) => {
					const ip = input.in.read();
					expect(ip.data.name).to.equal(index);
					index += 1;
				});
				graph.initialize(firstComponent, { length: count });
				graph.initialize(firstComponent, { interval });
				graph.initialize(secondComponent, { interval });
				graph.connect(firstComponent, 'out', secondComponent, 'in', 0, timeout);
				graph.connect(secondComponent, 'out', finalComponent, 'in', 0, timeout);
				graph.run(() => {
					expect(index).to.equal(count);
					done();
				});
			});

		});

	});

});
