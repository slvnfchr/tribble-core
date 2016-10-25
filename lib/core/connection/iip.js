
'use strict';

/**
 * Connection base class
 */

const Connection = require('./base');

class IIPConnection extends Connection {

	constructor() {
		super();
		this.addListener(Connection.events.DEQUEUE, () => {
			this.close();
		});
	}

}

module.exports = IIPConnection;
