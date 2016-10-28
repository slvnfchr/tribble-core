
'use strict';

const path = require('path');
const expect = require('chai').expect;
const library = require('../lib/');

const Component = library.Component;
const Graph = library.Graph;
const File = library.file.File;
const walker = library.file.walker;
const reader = library.file.reader;

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
			expect(file).to.have.all.keys('base', 'name', 'path', 'fullPath', 'extension', 'mediatype', 'contents');
			expect(file.base).to.be.null;
			expect(file.name).to.equal(name);
			expect(file.path).to.be.null;
			expect(file.fullPath).to.equal(path.resolve(__dirname, name));
			expect(file.mediatype).to.equal('text/html');
			expect(file.contents).to.be.null;
			done();
		});

		it('Extended instantiation', (done) => {
			const properties = { fullPath: __filename };
			const file = File.create(properties);
			Object.assign(properties, {
				base: null,
				contents: null,
				path: null,
				name: 'file.js',
				extension: 'js',
				mediatype: 'application/javascript',
			});
			expect(file).to.deep.equal(properties);
			done();
		});

	});

	describe('Components', () => {

		it('Walker component should emit IPs with File data', (done) => {
			const upComponent = walker();
			const graph = new Graph();
			graph.initialize(upComponent, { base: path.resolve(__dirname, '../') });
			graph.initialize(upComponent, { mask: '^[^.]+' });
			const downComponent = new Component((input) => {
				const ip = input.in.read();
				expect(ip.data).to.have.all.keys('base', 'name', 'path', 'fullPath', 'extension', 'level', 'mediatype', 'contents');
			});
			graph.connect(upComponent, 'out', downComponent, 'in');
			graph.run(done);
		});

		it('Reader component should emit IPs with file contents', (done) => {
			const upComponent = walker();
			const downComponent = reader();
			const finalComponent = new Component((input) => {
				const ip = input.in.read();
				expect(ip.data.contents).not.to.be.null;
			});
			const graph = new Graph();
			graph.initialize(upComponent, { base: path.resolve(__dirname, '../') });
			graph.initialize(upComponent, { mask: '^[^.]+' });
			graph.connect(upComponent, 'out', downComponent, 'in');
			graph.connect(downComponent, 'out', finalComponent, 'in');
			graph.run(done);
		});

	});

});
