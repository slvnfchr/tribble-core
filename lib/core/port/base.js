
'use strict';

/**
 * Base port class
 * @class Port
 */

class Port {

	constructor(component, name) {
		this.component = component;
		this.name = name;
		this.connection = null;
	}

}

module.exports = Port;
