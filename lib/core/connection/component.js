
'use strict';

/**
 * Connection class between components
 */

const Connection = require('./base');
const Component = require('../component');

function ComponentConnection(capacity, timeout) {

	Connection.call(this);

	this.capacity = capacity || 0;
	this.timeout = timeout || 1000;

	let _timer = null; // eslint-disable-line no-underscore-dangle
	this.addListener(Connection.events.DEQUEUE, () => {
		// close connection if all up processes are closed
		if (!this.hasData() && this.upComponents.length > 0) {
			let closed = true;
			this.upComponents.forEach((component) => {
				closed = closed && component.status === Component.status.CLOSED;
			});
			if (closed) {
				clearTimeout(_timer);
				_timer = setTimeout(this.close, this.timeout);
			}
		}
	});

	this.addListener(Connection.events.INITIALIZE, () => {
		if (this.downComponent && this.downComponent.status === Component.status.NOT_INITIALIZED) {
			this.downComponent.initialize(true);
		}
	});

	this.addListener(Connection.events.ENQUEUE_AFTER, () => {
		if (this.downComponent && this.downComponent.status !== Component.status.ACTIVE && this.pendingIPCount >= this.capacity) {
			this.downComponent.run();
		}
	});

}
ComponentConnection.prototype = Object.create(Connection.prototype);

ComponentConnection.events = Object.assign({}, Connection.events);

module.exports = ComponentConnection;
