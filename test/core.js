
'use strict';

const expect = require('chai').expect;
const stream = require('stream');
const path = require('path');
const File = require('../lib/file');
const Walker = require('../lib/walker');
const Plugin = require('../lib/plugin');
const constants = require('../lib/constants');

describe('Core modules', () => {

	let filesCount = 0;

	describe('File class', () => {

		it('Required parameters for instantiation', (done) => {
			expect(File.create).to.throw(Error);
			expect(File.create.bind(File, { fullPath: null })).to.throw(Error);
			expect(File.create.bind(File, { fullPath: '' })).to.throw(Error);
			expect(File.create.bind(File, { fullPath: '/path/to/file' })).not.to.throw(Error);
			done();
		});

		it('Minimal instantiation', (done) => {
			const name = 'test.htm';
			const file = File.create({ fullPath: path.resolve(__dirname, name) });
			expect(file).to.have.all.keys('base', 'name', 'path', 'fullPath', 'type', 'data');
			expect(file.base).to.be.null;
			expect(file.name).to.equal(name);
			expect(file.path).to.be.null;
			expect(file.fullPath).to.equal(path.resolve(__dirname, name));
			expect(file.type).to.equal('text/html');
			done();
		});

		it('Extended instantiation', (done) => {
			const properties = {
				base: __dirname,
				name: 'test.js',
				path: 'test/test.js',
				fullPath: '/path/to/test.js',
				data: null,
			};
			const file = File.create(properties);
			Object.assign(properties, { type: 'application/javascript' });
			expect(file).to.deep.equal(properties);
			done();
		});

	});

	describe('Files tree traversal stream', () => {

		it('Get single file', (done) => {
			Walker.create(__filename).on('data', (file) => {
				expect(file).to.be.instanceof(File);
				expect(file.name).to.equal(path.basename(__filename));
				expect(file.type).to.equal(constants.mediatypes.js);
				expect(file.fullPath).to.equal(__filename);
			}).on('end', () => {
				done();
			});
		});

		it('Get directory files', (done) => {
			Walker.create(__dirname, ['*.js']).on('data', (file) => {
				expect(file).to.be.instanceof(File);
				expect(file.name).to.match(/.*\.js$/);
				filesCount += 1;
			}).on('end', () => {
				done();
			});
		});

	});

	describe('Plugin class', () => {

		it('Properties', (done) => {
			const inputTypes = [constants.mediatypes.sass, constants.mediatypes.scss];
			const outputTypes = [constants.mediatypes.css, constants.mediatypes.map];
			const type = constants.types.POSTPROCESSOR;
			const processFunc = function process() {};
			const createdPlugin = new Plugin(inputTypes, outputTypes, type, processFunc);
			expect(createdPlugin).to.be.instanceof(stream.Transform);
			expect(createdPlugin).to.have.property('input');
			expect(createdPlugin.input).to.have.all.keys('mediatypes', 'extensions');
			expect(createdPlugin.input.mediatypes).to.equal(inputTypes);
			expect(createdPlugin).to.have.property('output');
			expect(createdPlugin.output).to.have.all.keys('mediatypes', 'extensions');
			expect(createdPlugin.output.mediatypes).to.equal(outputTypes);
			expect(createdPlugin).to.have.property('type');
			expect(createdPlugin.type).to.equal(type);
			expect(createdPlugin).to.have.property('priority');
			expect(createdPlugin.priority).not.to.be.NaN;
			expect(createdPlugin.priority).to.equal(parseInt(createdPlugin.priority, 10));
			expect(createdPlugin).to.have.property('process');
			expect(createdPlugin.process).to.equal(processFunc);
			expect(createdPlugin).to.respondTo('getSources');
			expect(createdPlugin.getSources(__dirname)).to.be.instanceof(Walker);
			done();
		});

		it('Execution mecanism', (done) => {
			let processing = 0;
			let processed = 0;
			const inputTypes = [constants.mediatypes.js];
			const outputTypes = [constants.mediatypes.js];
			const type = constants.types.POSTPROCESSOR;
			const processFunc = function process(input, output, error) {
				processing += 1;
				expect(input).to.respondTo('read');
				expect(input.read()).to.be.instanceof(File);
				expect(input.read().name).to.match(/.*\.js$/);
				expect(input.read().base).to.equal(__dirname);
				expect(output).to.respondTo('write');
				output.write(input.read());
				expect(error).to.respondTo('write');
			};
			const createdPlugin = new Plugin(inputTypes, outputTypes, type, processFunc);
			createdPlugin.on('data', (data) => {
				processed += 1;
				expect(data).to.be.instanceof(File);
			});
			createdPlugin.on('end', () => {
				expect(processing).to.equal(filesCount);
				expect(processed).to.equal(filesCount);
				done();
			});
			const pipeStart = createdPlugin.getSources(__dirname);
			pipeStart.pipe(createdPlugin);
		});

	});

});

