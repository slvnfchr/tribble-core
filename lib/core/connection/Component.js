
'use strict';

/**
 * Connection class between components
 */

const Base = require('./Base');
const Component = require('../Component');

class Connection extends Base {

	constructor(capacity, timeout) {
		super();
		this.capacity = capacity || 0;
		this.timeout = timeout || 10;

		let _timer = null; // eslint-disable-line no-underscore-dangle
		this.addListener(Base.events.DEQUEUE, () => {
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

		this.addListener(Base.events.ENQUEUE, () => {
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

		this.addListener(Base.events.CLOSE, () => {
			clearTimeout(_timer);
			if (this.downComponent) {
				this.downComponent.check();
			}
		});

	}

}

Connection.events = Object.assign({}, Base.events);

module.exports = Connection;
