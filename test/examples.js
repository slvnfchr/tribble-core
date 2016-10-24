
'use strict';

const path = require('path');
const expect = require('chai').expect;
const Component = require('../lib/core/component');
const Graph = require('../lib/core/graph');

describe('Simple graph execution test cases', () => {

	it('If connection capacity is not reached, no IP should be emitted', (done) => {
		const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
		const downComponent = new Component(path.resolve(__dirname, './utils/tracer'));
		const graph = new Graph();
		const count = 5;
		const interval = 5;
		const timeout = count * interval;
		const listener = (ip) => {
			expect(ip).to.be.null;
		};
		process.addListener('test', listener);
		graph.initialize(upComponent, { length: count });
		graph.initialize(upComponent, { interval });
		graph.connect(upComponent, 'out', downComponent, 'in', count + 1, timeout);
		graph.run(() => {
			process.removeListener('test', listener);
			done();
		});
	});

	it('If connection capacity is reached, all IPs should be emitted', (done) => {
		const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
		const downComponent = new Component(path.resolve(__dirname, './utils/tracer'));
		const graph = new Graph();
		const count = 10;
		const capacity = 5;
		const interval = 20;
		let index = 0;
		const start = process.hrtime();
		let time = start;
		const listener = (ip) => {
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
		};
		process.addListener('test', listener);
		graph.initialize(upComponent, { length: count });
		graph.initialize(upComponent, { interval });
		graph.connect(upComponent, 'out', downComponent, 'in', capacity);
		graph.run(() => {
			expect(index).to.equal(count);
			process.removeListener('test', listener);
			done();
		});
	});

	it('If connection timeout is reached, only first IP should be emitted', (done) => {
		const upComponent = new Component(path.resolve(__dirname, './utils/generator'));
		const downComponent = new Component(path.resolve(__dirname, './utils/tracer'));
		const graph = new Graph();
		const count = 5;
		const interval = 50;
		const timeout = 10; // timeout below emission interval
		const listener = (ip) => {
			const data = ip.data;
			expect(data.name).to.equal(0);
		};
		process.addListener('test', listener);
		graph.initialize(upComponent, { length: count });
		graph.initialize(upComponent, { interval });
		graph.connect(upComponent, 'out', downComponent, 'in', 0, timeout);
		graph.run(() => {
			process.removeListener('test', listener);
			done();
		});
	});

});
