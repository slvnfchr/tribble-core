
'use strict';

const path = require('path');
const expect = require('chai').expect;
const Component = require('../lib/core/component');
const Graph = require('../lib/core/graph');
const File = require('../lib/file/file');

describe('File components', () => {

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
			expect(file).to.have.all.keys('base', 'name', 'path', 'fullPath', 'extension', 'mediatype', 'data');
			expect(file.base).to.be.null;
			expect(file.name).to.equal(name);
			expect(file.path).to.be.null;
			expect(file.fullPath).to.equal(path.resolve(__dirname, name));
			expect(file.mediatype).to.equal('text/html');
			done();
		});

		it('Extended instantiation', (done) => {
			const properties = { fullPath: __filename };
			const file = File.create(properties);
			Object.assign(properties, {
				base: null,
				data: null,
				path: null,
				name: 'file.js',
				extension: 'js',
				mediatype: 'application/javascript',
			});
			expect(file).to.deep.equal(properties);
			done();
		});

	});

	describe('File tree traversal', () => {

		it('Walker component should emit IPs with File data', (done) => {
			const upComponent = new Component(path.resolve(__dirname, '../lib/file/walker'));
			const downComponent = new Component(path.resolve(__dirname, './utils/tracer'));
			const graph = new Graph();
			graph.initialize(upComponent, { base: path.resolve(__dirname, '../') });
			graph.initialize(upComponent, { mask: '^[^.]+' });
			const listener = (ip) => {
				expect(ip.data).to.be.instanceof(File);
			};
			process.addListener('test', listener);
			graph.connect(upComponent, 'out', downComponent, 'in');
			graph.run(() => {
				done();
			});
		});

	});

});
