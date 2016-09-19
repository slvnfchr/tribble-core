
'use strict';

const expect = require('chai').expect;
const stream = require('stream');
const plugin = require('../lib/index.js');

describe('Core', () => {

	it('Wrong instantiation should throw an error', (done) => {
		expect(() => plugin()).to.throw(Error);
		expect(() => plugin('foo')).to.throw(Error);
		expect(() => plugin([])).to.throw(Error);
		expect(() => plugin([plugin.types.sass])).to.throw(Error);
		expect(() => plugin([plugin.types.sass], 'foo')).to.throw(Error);
		expect(() => plugin([plugin.types.sass], plugin.types.css)).to.throw(Error);
		expect(() => plugin([plugin.types.sass], plugin.types.css, 'foo')).to.throw(Error);
		expect(() => plugin([plugin.types.sass], plugin.types.css, () => {})).not.to.throw(Error);
		done();
	});

	it('Properties input, output and process', (done) => {
		const input = [plugin.types.sass, plugin.types.scss];
		const output = plugin.types.css;
		const process = () => 'foo';
		const createdPlugin = plugin(input, output, process);
		expect(createdPlugin).to.have.property('input');
		expect(createdPlugin.input).to.equal(input);
		expect(createdPlugin).to.have.property('output');
		expect(createdPlugin.output).to.equal(output);
		expect(createdPlugin).to.have.property('process');
		expect(createdPlugin.process).to.equal(process);
		done();
	});

	it('Method getStream', (done) => {
		const input = [plugin.types.sass, plugin.types.scss];
		const output = plugin.types.css;
		const process = () => 'foo';
		const createdPlugin = plugin(input, output, process);
		expect(createdPlugin).to.respondTo('getStream');
		expect(createdPlugin.getStream()).to.be.instanceof(stream.Transform);
		done();
	});

});
