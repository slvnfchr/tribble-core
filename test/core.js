
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
			expect(component).to.have.property('inports');
			expect(component).to.have.property('outports');
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
			expect(component.inports[name]).to.equal(port);
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
			expect(component.outports[name]).to.equal(port);
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
			expect(component.inports).to.have.property(dataKey);
			expect(component.getInput(dataKey).read().data).to.equal(dataValue);
			done();
		});

		it('Connection between components', (done) => {
			const upComponent = new Component();
			const downComponent = new Component();
			const capacity = 10;
			const graph = new Graph();
			graph.connect(upComponent, 'out', downComponent, 'in', capacity);
			expect(upComponent.outports).to.have.property('out');
			expect(upComponent.outports.out.connection.capacity).to.equal(capacity);
			expect(upComponent.outports.out.connection.downComponent).to.equal(downComponent);
			expect(downComponent.inports).to.have.property('in');
			expect(upComponent.outports.out.connection).to.equal(downComponent.inports.in.connection);
			expect(downComponent.inports.in.connection.upComponents.length).to.equal(1);
			expect(downComponent.inports.in.connection.upComponents[0]).to.equal(upComponent);
			done();
		});

		it('Graph run', (done) => {
			const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
			const downComponent = new Component(path.resolve(__dirname, './utils/tracer'));
			const graph = new Graph();
			graph.initialize(upComponent, { length: 5 });
			graph.connect(upComponent, 'out', downComponent, 'in', 5);
			graph.run(done);
		});

	});
});

