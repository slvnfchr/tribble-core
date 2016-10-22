
'use strict';

/**
 * Connection base class
 */

const Connection = require('./base');

function IIPConnection() {

	Connection.call(this);

	this.addListener(Connection.events.DEQUEUE, () => {
		this.close();
	});

}

IIPConnection.prototype = Object.create(Connection.prototype);

module.exports = IIPConnection;
