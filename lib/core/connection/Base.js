
'use strict';

/**
 * Connection base class
 */

const EventEmitter = require('events');
const IP = require('../IP');
const Queue = require('./Queue');

class Connection extends EventEmitter {

	constructor() {
		super();
		this.closed = false;

		let _contents = new Queue(); // eslint-disable-line no-underscore-dangle

		this.upComponents = [];
		this.downComponent = null;

		Object.defineProperty(this, 'pendingIPCount', {
			enumerable: true,
			get: function get() {
				return _contents.length;
			},
		});

		this.hasData = () => !_contents.isEmpty();

		let _allIPReceived = false; // eslint-disable-line no-underscore-dangle
		this.getData = () => {
			if (!this.hasData() || this.closed) {
				return null;
			}
			const ip = _contents.dequeue();
			if (_allIPReceived && !this.hasData()) this.close();
			this.emit(Connection.events.DEQUEUE, ip);
			ip.owner = this.downComponent;
			return ip;
		};

		this.getAllData = () => _contents.getValues();

		this.putData = (ip) => {
			if (ip === null) {
				_allIPReceived = true;
				if (!this.hasData()) this.close();
				return -1;
			}
			if (this.closed) {
				return -1;
			}
			const data = (ip instanceof IP) ? ip : new IP(ip);
			data.owner = null;
			_contents.enqueue(data);
			this.emit(Connection.events.ENQUEUE, data);
			return 0;
		};

		this.purgeData = () => {
			_contents = new Queue();
		};

		this.connect = (output, input) => {
			if (!output) { // Initial IP connection
				Object.assign(input, { connection: this });
			} else {
				Object.assign(output, { connection: this });
				Object.assign(input, { connection: this });
				this.upComponents.push(output.component);
			}
			this.downComponent = input.component;
		};

		this.close = () => {
			this.closed = true;
			this.emit(Connection.events.CLOSE);
			this.purgeData();
		};

	}

}

Connection.events = {
	ENQUEUE: 'enqueue',
	DEQUEUE: 'dequeue',
	CLOSE: 'close',
};

module.exports = Connection;
