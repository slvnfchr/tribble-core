
'use strict';

/**
 * FIFO (first-in, first-out) queue class
 */

class Queue {

	constructor() {
		this.queue = [];
		this.cursor = 0;
		this.length = 0;
	}

	enqueue(value) {
		this.queue.push(value);
		this.length += 1;
	}

	dequeue() {
		const value = this.queue[this.cursor];
		this.cursor += 1;
		this.length -= 1;
		if (this.cursor > this.queue.length / 2) {
			this.queue = this.queue.slice(this.cursor);
			this.length = this.queue.length;
			this.cursor = 0;
		}
		return value;
	}

	isEmpty() {
		return this.length === 0;
	}

}

module.exports = Queue;
