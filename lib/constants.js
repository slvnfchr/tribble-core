
'use strict';

/**
 * Plugins constants
 */

const mimedb = require('mime-db');

const mediatypes = {}; // extensions/mediatype mapping
const extensions = {}; // mediatype/extensions mapping

Object.keys(mimedb).forEach((mediatype) => {
	if (mimedb[mediatype].extensions !== undefined) {
		const type = {};
		type[mediatype] = mimedb[mediatype].extensions;
		Object.assign(extensions, type);
		mimedb[mediatype].extensions.forEach((extension) => {
			const ext = {};
			ext[extension] = mediatype;
			Object.assign(mediatypes, ext);
		});
	}
});

const types = {
	PREPROCESSOR: 'preprocessor', // ex: SASS, Coffeescript
	TRANSFORM: 'transform', // any transformation plugin, order independant
	POSTPROCESSOR: 'postprocessor', // ex: postCSS, r.js
	AGGREGATOR: 'aggregator', // ex: templating engine
	MINIFIER: 'minifier', // ex: closure compiler
	PACKAGER: 'packager', // ex: zip, electron
};

const priorities = [types.PREPROCESSOR, types.TRANSFORM, types.POSTPROCESSOR, types.AGGREGATOR, types.MINIFIER];

const environments = {
	BUILD: 'build',
	DEVELOPMENT: 'development',
	SCAFFOLDING: 'scaffolding',
};

module.exports = {
	mediatypes,
	extensions,
	types,
	priorities,
	environments,
};
