
'use strict';

/**
 * Tribble plugin main file
 */

const Plugin = require('./plugin');
const constants = require('./constants');
const utilities = require('./util');

module.exports = Plugin.create;
module.exports.types = constants.types;
module.exports.mediatypes = constants.mediatypes;
module.exports.util = utilities;
