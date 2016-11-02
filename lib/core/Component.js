
'use strict';

/**
 * Component base class
 */

const EventEmitter = require('events');
const path = require('path'); // eslint-disable-line camelcase
const child_process = require('child_process'); // eslint-disable-line camelcase
const Connection = require('./connection/Base');

class Inputs extends Object {
	read() {
		let data = {};
		const ports = Object.getOwnPropertyNames(this);
		ports.forEach((port) => {
			const value = this[port].read();
			data[port] = value ? value.data : null;
		});
		if (ports.length === 1) data = data[ports[0]];
		return data;
	}
}

class Outputs extends Object {
	send(data) {
		const ports = Object.getOwnPropertyNames(this);
		if (ports.length === 1) {
			this[ports[0]].send(data);
		} else if (data) {
			Object.keys(data).forEach((port) => {
				if (this[port]) this[port].send(data[port]);
			});
		}
	}
}

class Component extends EventEmitter {

	constructor(handler) {

		super();
		this.handler = handler;
		this.pid = process.pid;
		this.input = new Inputs(); // Enable input.read() shorthand
		this.output = new Outputs(); // Enable output.send() shorthand
		this.fork = false;

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

		let _process = null; // eslint-disable-line no-underscore-dangle
		this.initialize = () => {
			this.status = Component.status.READY_TO_EXECUTE;
			if (!this.handler) return;
			if (!_process) {
				if (typeof this.handler === 'function') {
					_process = this.handler;
				} else if (!this.fork) {
					_process = require(this.handler); // eslint-disable-line global-require
				} else {
					_process = child_process.fork(path.resolve(__dirname, 'process'), [
						this.handler,
						Object.keys(this.input),
						Object.keys(this.output),
					], {
						cwd: process.cwd(),
						env: process.env,
					});
					this.pid = _process.pid;
					_process.on('message', (data) => {
						if (data.type === 'out') { // forward output port ips
							this.output[data.port].send(data.data);
						} else if (data.type === 'in') { // make inport port reads
							this.input[data.port].read();
						}
					});
					const _forward = port => ip => _process.send({ type: 'in', port, data: ip.data }); // eslint-disable-line no-underscore-dangle
					Object.keys(this.input).forEach((port) => {
						// forward already queued ips
						this.input[port].connection.getAllData().forEach((ip) => {
							_forward(port)(ip);
						});
						// listen to forthcoming ips
						this.input[port].connection.addListener(Connection.events.ENQUEUE, _forward(port));
					});
				}
			}
		};

		this.execute = () => {
			if (!this.fork) {
				_process.call(this, this.input, this.output);
				if (Object.keys(this.output) === 0) this.check(); // leaf component
			}
		};

		this.check = () => {
			let closed = true;
			Object.keys(this.input).forEach((port) => {
				closed = closed && this.input[port].connection.closed;
			});
			if (closed) {
				Object.assign(this, { status: Component.status.CLOSED });
				// kill all closed up processes
				const statuses = [];
				Object.keys(this.input).forEach((port) => {
					this.input[port].connection.upComponents.forEach((up) => {
						if (up.status === Component.status.CLOSED) up.kill();
						statuses.push(up.status);
					});
				});
				// kill current process if all up processes are done
				if (statuses.length > 0 && statuses.filter(status => status !== Component.status.DONE).length === 0) {
					this.kill();
				}
			}
		};

		this.activate = () => {
			this.status = Component.status.ACTIVE;
			if (this.fork) _process.send({ type: 'activate' });
		};

		this.kill = () => {
			this.status = Component.status.DONE;
			Object.keys(this.output).forEach((port) => {
				if (this.output[port].connection.downComponent.status === Component.status.CLOSED) {
					this.output[port].connection.downComponent.kill();
				}
			});
			if (this.fork) {
				_process.on('close', () => {
					_process = null;
				});
				_process.kill('SIGHUP');
			}
		};

	}

}

Component.events = {
	STATE_CHANGE: 'state_change',
};

Component.status = {
	NOT_INITIALIZED: 'not_initialized',
	READY_TO_EXECUTE: 'ready_to_execute',
	ACTIVE: 'active',
	CLOSED: 'closed',
	DONE: 'done',
};

module.exports = Component;
