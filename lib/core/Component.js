
'use strict';

/**
 * Component base class
 */

const EventEmitter = require('events');
const path = require('path'); // eslint-disable-line camelcase
const child_process = require('child_process'); // eslint-disable-line camelcase
const IP = require('./IP');
const Connection = require('./connection/Base');
const IIPConnection = require('./connection/IIP');

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

	constructor(handler, timeout) {

		super();
		this.handler = handler;

		this.pid = process.pid;
		this.input = new Inputs(); // Enable input.read() shorthand
		this.output = new Outputs(); // Enable output.send() shorthand
		this.fork = false;
		this.timeout = timeout || 0;

		let _timer = null; // eslint-disable-line no-underscore-dangle

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
						this.timeout,
						Object.keys(this.input).filter(port => this.input[port].connection instanceof IIPConnection),
						Object.keys(this.input),
						Object.keys(this.output),
					], {
						cwd: process.cwd(),
						env: process.env,
					});
					this.pid = _process.pid;
					_process.on('message', (data) => {
						if (data.type === 'out') { // forward output port ips
							const ip = new IP(data.data);
							Object.assign(ip, { owner: this });
							this.output[data.port].send(ip);
						} else if (data.type === 'in') { // make inport port reads
							this.input[data.port].read();
						} else if (data.type === 'timeout') { // forward timeout
							this.kill();
						}
					});
					const _forward = port => (ip) => { // eslint-disable-line no-underscore-dangle
						Object.assign(ip, { owner: null });
						_process.send({ type: 'in', port, data: ip.data }); // eslint-disable-line no-underscore-dangle
					};
					const _close = port => () => _process.send({ type: 'close', port }); // eslint-disable-line no-underscore-dangle
					Object.keys(this.input).forEach((port) => {
						// forward already queued ips
						this.input[port].connection.getAllData().forEach((ip) => {
							_forward(port)(ip);
						});
						// listen to forthcoming ips
						this.input[port].connection.addListener(Connection.events.CLOSE, _close(port));
						this.input[port].connection.addListener(Connection.events.ENQUEUE, _forward(port));
					});
				}
			}
		};

		this.execute = () => {
			if (!this.fork) {
				_process.call(this, this.input, this.output);
				if (Object.keys(this.output).length > 0 && this.timeout) {
					clearTimeout(_timer);
					_timer = setTimeout(this.kill, this.timeout);
				}
			}
		};

		this.check = () => {
			clearTimeout(_timer);
			let closed = true;
			Object.keys(this.input).filter(port => !(this.input[port].connection instanceof IIPConnection)).forEach((port) => {
				closed = closed && this.input[port].connection.closed;
			});
			if (closed) {
				Object.assign(this, { status: Component.status.CLOSED });
				if (!this.fork || !this.executed) {
					if (Object.keys(this.output).length) {
						_timer = setTimeout(this.kill, this.timeout);
					} else {
						this.kill();
					}
				}
			}
		};

		this.activate = () => {
			this.status = Component.status.ACTIVE;
			this.executed = true;
			if (this.fork) {
				_process.send({ type: 'activate' });
			}
		};

		this.kill = () => {
			clearTimeout(_timer);
			this.status = Component.status.DONE;
			Object.keys(this.output).forEach((port) => {
				if (this.output[port].connection.upComponents.filter(component => component.status !== Component.status.DONE).length === 0) {
					this.output[port].connection.close();
				}
			});
			if (this.fork && _process) {
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
