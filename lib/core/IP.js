
'use strict';

/**
 * Base information packet (IP) class
 * @class IP
 * @param {object} properties - Packet properties
 * @property {Component} owner - Packet owner
 * @property {string} type - Packet type
 * @property {object} data - Packet data
 */

class IP {

	constructor(data) {
		this.owner = null;
		this.type = IP.types.NORMAL;
		this.data = data;
	}

}

IP.types = {
	NORMAL: 'normal',
	OPEN: 'open', // opening bracket IP
	CLOSE: 'close', // closing bracket IP
};

module.exports = IP;
