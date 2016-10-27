
'use strict';

/**
 * Connection class between components
 */

const Connection = require('./base');
const Component = require('../component');

class ComponentConnection extends Connection {

	constructor(capacity, timeout) {
		super();
		this.capacity = capacity || 0;
		this.timeout = timeout || 10;

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

		this.addListener(Connection.events.ENQUEUE, () => {
			if (!this.downComponent) return;
			if (this.downComponent.status === Component.status.NOT_INITIALIZED) {
				this.downComponent.initialize();
			}
			if (this.downComponent.status === Component.status.READY_TO_EXECUTE && this.pendingIPCount >= this.capacity) {
				this.downComponent.activate();
			}
			if (this.downComponent.status === Component.status.ACTIVE && !this.downComponent.fork) {
				while (this.hasData()) {
					this.downComponent.execute();
				}
			}
			this.upComponents.filter(component => component.status === Component.status.ACTIVE).forEach((component) => {
				component.check();
			});
			clearTimeout(_timer);
			_timer = setTimeout(this.close, this.timeout);
		});

		this.addListener(Connection.events.CLOSE, () => {
			if (this.downComponent) {
				this.downComponent.check();
			}
		});

	}

}

ComponentConnection.events = Object.assign({}, Connection.events);

module.exports = ComponentConnection;
