
'use strict';

/**
 * Connection base class
 */

const Base = require('./Base');

class IIPConnection extends Base {

	constructor() {
		super();
		this.addListener(Base.events.DEQUEUE, () => {
			this.close();
		});
	}

}

module.exports = IIPConnection;
