
'use strict';

/**
 * Connection base class
 */

const EventEmitter = require('events');
const IP = require('../ip');
const Queue = require('./queue');

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

		this.getData = () => {
			if (!this.hasData() || this.closed) {
				return null;
			}
			const ip = _contents.dequeue();
			this.emit(Connection.events.DEQUEUE, ip);
			ip.owner = this.downComponent;
			const nextIP = _contents.getNext();
			if (nextIP && nextIP.data === null) this.close();
			return ip;
		};

		this.putData = (ip) => {
			if (this.closed) {
				return -1;
			}
			const data = (ip instanceof IP) ? ip : new IP(ip);
			this.emit(Connection.events.INITIALIZE);
			this.emit(Connection.events.ENQUEUE_BEFORE, data);
			_contents.enqueue(data);
			this.emit(Connection.events.ENQUEUE_AFTER, data);
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
	INITIALIZE: 'initialize', // fired on first ip
	ENQUEUE_BEFORE: 'enqueue_before',
	ENQUEUE_AFTER: 'enqueue_after',
	DEQUEUE: 'dequeue',
	CLOSE: 'close',
};

module.exports = Connection;
