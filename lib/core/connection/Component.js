
'use strict';

/**
 * Connection class between components
 */

const Base = require('./Base');
const Component = require('../Component');

class Connection extends Base {

	constructor(capacity) {
		super();
		this.capacity = capacity || 0;

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
		});

		this.addListener(Base.events.CLOSE, () => {
			if (this.downComponent) {
				this.downComponent.check();
			}
		});

	}

}

Connection.events = Object.assign({}, Base.events);

module.exports = Connection;
