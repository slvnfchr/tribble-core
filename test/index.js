
'use strict';

const expect = require('chai').expect;
const plugin = require('../lib/index');
const constants = require('../lib/constants');
const Plugin = require('../lib/plugin');

describe('Main module', () => {

	it('Main function should instantiate a Plugin object', (done) => {
		expect(plugin).to.be.instanceof(Function);
		expect(() => plugin()).to.throw(Error);
		expect(() => plugin('foo')).to.throw(Error);
		expect(() => plugin([])).to.throw(Error);
		expect(() => plugin([plugin.mediatypes.sass])).to.throw(Error);
		expect(() => plugin([plugin.mediatypes.sass], 'foo')).to.throw(Error);
		expect(() => plugin([plugin.mediatypes.sass], plugin.mediatypes.css)).to.throw(Error);
		expect(() => plugin([plugin.mediatypes.sass], plugin.mediatypes.css, plugin.types.PREPROCESSOR)).to.throw(Error);
		expect(() => plugin([plugin.mediatypes.sass], plugin.mediatypes.css, plugin.types.PREPROCESSOR, () => {})).not.to.throw(Error);
		expect(plugin([plugin.mediatypes.sass], plugin.mediatypes.css, plugin.types.PREPROCESSOR, () => {})).to.be.instanceof(Plugin);
		done();
	});

	it('Module properties are types, mediatypes and util', (done) => {
		expect(plugin).to.have.property('types');
		expect(plugin.types).to.deep.equal(constants.types);
		expect(plugin).to.have.property('mediatypes');
		expect(plugin.mediatypes).to.deep.equal(constants.mediatypes);
		expect(plugin).to.have.property('util');
		expect(plugin.util).to.respondTo('build');
		expect(plugin.util).to.respondTo('load');
		expect(plugin.util).to.respondTo('lookup');
		done();
	});

});

