
'use strict';

/**
 * Component base class
 */

const EventEmitter = require('events');
const path = require('path'); // eslint-disable-line camelcase
const child_process = require('child_process'); // eslint-disable-line camelcase
const Connection = require('./connection/base');

function Component(name) {
	this.name = name;
	this.input = {};
	this.output = {};

	let _status = Component.status.NOT_INITIALIZED; // eslint-disable-line no-underscore-dangle
	Object.defineProperty(this, 'status', {
		enumerable: true,
		get: () => _status,
		set: (value) => {
			if (value !== _status) {
				_status = value;
				this.emit(Component.events.STATE_CHANGE);
			}
		},
	});

	const _check = (component) => { // eslint-disable-line no-underscore-dangle
		let closed = true;
		Object.keys(component.input).forEach((port) => {
			closed = closed && component.input[port].connection.closed;
		});
		if (closed) {
			Object.assign(component, { status: Component.status.CLOSED });
			// kill all closed up processes
			const statuses = [];
			Object.keys(component.input).forEach((port) => {
				component.input[port].connection.upComponents.forEach((up) => {
					if (up.status === Component.status.CLOSED) up.kill();
					statuses.push(up.status);
				});
			});
			// kill current process if all up processes are done
			if (statuses.length > 0 && statuses.filter(status => status !== Component.status.DONE).length === 0) {
				component.kill();
			}
		} else {
			component.run();
		}
	};

	let _process = null; // eslint-disable-line no-underscore-dangle
	this.initialize = (runOnMainThread) => {
		this.status = Component.status.READY_TO_EXECUTE;
		if (this.name === undefined) return;
		if (!_process) {
			if (runOnMainThread) {
				_process = require(this.name); // eslint-disable-line global-require
			} else {
				_process = child_process.fork(path.resolve(__dirname, 'process'), [this.name], {
					cwd: process.cwd(),
					env: Object.assign(process.env, {
						input: Object.keys(this.input),
						output: Object.keys(this.output),
					}),
				});
				_process.on('message', (data) => {
					if (data === null) {
						_check(this);
					} else if (data.type === 'out') { // forward output port ips
						this.output[data.port].send(this.output[data.port].createIP(data.data));
					} else if (data.type === 'in') { // make inport port reads
						this.input[data.port].read();
					}
				});
				const _forward = port => ip => _process.send({ type: 'in', port, data: ip.data }); // eslint-disable-line no-underscore-dangle
				Object.keys(this.input).forEach((port) => {
					// forward already queued ips
					while (this.input[port].connection.hasData()) {
						_forward(port)(this.input[port].connection.getData());
					}
					// listen to forthcoming ips
					this.input[port].connection.addListener(Connection.events.ENQUEUE_BEFORE, _forward(port));
				});
			}
		}
	};

	this.run = (runOnMainThread) => {
		if (this.status === Component.status.NOT_INITIALIZED) this.initialize(runOnMainThread); // for starter processes
		this.status = Component.status.ACTIVE;
		if (_process instanceof child_process.ChildProcess) {
			_process.send(null);
		} else if (_process) {
			setImmediate(() => {
				_process.call(this, this.input, this.output);
				_check(this);
			});
		}
	};

	this.kill = () => {
		this.status = Component.status.DONE;
		if (_process instanceof child_process.ChildProcess) {
			_process.on('close', () => {
				_process = null;
			});
			_process.kill('SIGHUP');
		}
	};
}
Component.prototype = Object.create(EventEmitter.prototype);

Component.events = {
	STATE_CHANGE: 'state_change',
};

Component.status = {
	NOT_INITIALIZED: 'not_initialized',
	READY_TO_EXECUTE: 'ready_to_execute',
	ACTIVE: 'active',
	CLOSED: 'closed',
};

module.exports = Component;
