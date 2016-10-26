
'use strict';

const path = require('path');
const EventEmitter = require('events');
const expect = require('chai').expect;
const Component = require('../lib/core/component');
const Port = require('../lib/core/port/base');
const InputPort = require('../lib/core/port/input');
const OutputPort = require('../lib/core/port/output');
const IP = require('../lib/core/ip');
const Connection = require('../lib/core/connection/base');
const ComponentConnection = require('../lib/core/connection/component');
const Graph = require('../lib/core/graph');

describe('Core modules', () => {

	describe('Component class', () => {

		it('Properties', (done) => {
			const component = new Component();
			expect(component).to.have.property('handler');
			expect(component).to.have.property('pid');
			expect(component).to.have.property('input');
			expect(component).to.have.property('output');
			expect(component).to.respondTo('initialize');
			expect(component).to.respondTo('run');
			expect(component).to.respondTo('execute');
			expect(component).to.respondTo('kill');
			done();
		});

	});

	describe('Port class', () => {

		it('Properties', (done) => {
			const component = new Component();
			const name = 'in';
			const port = new Port(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(port).to.have.property('connection');
			expect(port.connection).to.be.null;
			done();
		});

		it('Input port', (done) => {
			const component = new Component();
			const name = 'in';
			const port = new InputPort(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(component.input[name]).to.equal(port);
			done();
		});

		it('Output port', (done) => {
			const component = new Component();
			const name = 'out';
			const port = new OutputPort(component, name);
			expect(port).to.have.property('component');
			expect(port.component).to.equal(component);
			expect(port).to.have.property('name');
			expect(port.name).to.equal(name);
			expect(component.output[name]).to.equal(port);
			done();
		});

	});

	describe('Information packet', () => {

		it('Properties', (done) => {
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

		it('Properties and methods', (done) => {
			const connection = new Connection();
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
			expect(connection).to.respondTo('connect');
			expect(connection).to.respondTo('close');
			expect(connection).to.respondTo('hasData');
			expect(connection).to.respondTo('getData');
			expect(connection).to.respondTo('putData');
			expect(connection).to.respondTo('purgeData');
			done();
		});

		it('IP injection and retrieval', (done) => {
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new Connection();
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
			done();
		});

		it('Capacity', (done) => {
			const capacity = 5;
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new ComponentConnection(capacity);
			expect(connection).to.have.property('capacity');
			expect(connection.capacity).to.equal(capacity);
			for (let i = 0, n = capacity; i < n; i += 1) {
				connection.putData(ip);
			}
			expect(connection.pendingIPCount).to.equal(capacity);
			done();
		});

		it('Purge', (done) => {
			const capacity = 10;
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new Connection(capacity);
			for (let i = 0, n = capacity; i < n; i += 1) {
				connection.putData(ip);
			}
			connection.purgeData(ip);
			expect(connection.pendingIPCount).to.equal(0);
			done();
		});

		it('Close', (done) => {
			const properties = { foo: 'bar' };
			const ip = new IP(properties);
			const connection = new Connection();
			connection.putData(ip);
			connection.close();
			expect(connection.closed).to.be.true;
			expect(connection.getData()).to.be.null;
			done();
		});

		it('Ports', (done) => {
			const component = new Component();
			const input = new InputPort(component, 'in');
			const output = new OutputPort(component, 'out');
			const connection = new Connection();
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

		it('Component initialization', (done) => {
			const component = new Component();
			const data = {};
			const dataKey = 'size';
			const dataValue = 12;
			data[dataKey] = dataValue;
			const graph = new Graph();
			graph.initialize(component, data);
			expect(component.input).to.have.property(dataKey);
			expect(component.input[dataKey].read().data).to.equal(dataValue);
			done();
		});

		it('Connection between components', (done) => {
			const upComponent = new Component();
			const downComponent = new Component();
			const capacity = 10;
			const graph = new Graph();
			graph.connect(upComponent, 'out', downComponent, 'in', capacity);
			expect(upComponent.output).to.have.property('out');
			expect(upComponent.output.out.connection.capacity).to.equal(capacity);
			expect(upComponent.output.out.connection.downComponent).to.equal(downComponent);
			expect(downComponent.input).to.have.property('in');
			expect(upComponent.output.out.connection).to.equal(downComponent.input.in.connection);
			expect(downComponent.input.in.connection.upComponents.length).to.equal(1);
			expect(downComponent.input.in.connection.upComponents[0]).to.equal(upComponent);
			done();
		});

		it('If connection capacity is not reached, no IP should be emitted', (done) => {
			const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
			const downComponent = new Component((input) => {
				const ip = input.in.read();
				expect(true).to.be.false;
			});
			const graph = new Graph();
			const count = 5;
			const interval = 5;
			const timeout = count * interval;
			graph.initialize(upComponent, { length: count });
			graph.initialize(upComponent, { interval });
			graph.connect(upComponent, 'out', downComponent, 'in', count + 1, timeout);
			graph.run(done);
		});

		it('If connection capacity is reached, all IPs should be emitted', (done) => {
			const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
			const graph = new Graph();
			const count = 10;
			const capacity = 5;
			const interval = 20;
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
			graph.connect(upComponent, 'out', downComponent, 'in', capacity);
			graph.run(() => {
				expect(index).to.equal(count);
				done();
			});
		});

		it('If connection timeout is reached, only first IP should be emitted', (done) => {
			const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
			const graph = new Graph();
			const count = 5;
			const interval = 50;
			const timeout = 10; // timeout below emission interval
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

});
