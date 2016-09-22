
'use strict';

/**
 * Tribble plugin main file
 */

const Plugin = require('./plugin');
const constants = require('./constants');

module.exports = Plugin.create;
module.exports.types = constants.types;
module.exports.mediatypes = constants.mediatypes;
