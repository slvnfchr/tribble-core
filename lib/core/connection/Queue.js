
'use strict';

/**
 * FIFO (first-in, first-out) queue class
 */

class Queue {

	constructor() {
		this.queue = [];
		Object.defineProperty(this, 'length', {
			enumerable: true,
			get: function get() {
				return this.queue.length;
			},
		});
	}

	enqueue(value) {
		this.queue.push(value);
	}

	dequeue() {
		return this.queue.shift();
	}

	getValues() {
		return this.queue;
	}

	isEmpty() {
		return this.length === 0;
	}

}

module.exports = Queue;
