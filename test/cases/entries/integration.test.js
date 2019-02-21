const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const runWebpack = require('../../fixtures/runWebpack');
const checkContent = (content) => /this is a another runtime module/g.test(content);

describe('Webpack Integration Test: entries', () => {
    it('Entry is object', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        // options.entry = require('./paths.js').object;
        options.output.filename = '[name].js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
    it('Entry is array', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        options.entry = require('./paths.js').array;
        options.output.filename = '[name].array.js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'main.array.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
    it('Entry is functionArray', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        options.entry = require('./paths.js').functionArray;
        options.output.filename = '[name].functionArray.js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'main.functionArray.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
    it('Entry is function', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        options.entry = require('./paths.js').function;
        options.output.filename = '[name].function.js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'main.function.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
    it('Entry is function and return object', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        options.entry = require('./paths.js').functionObject;
        options.output.filename = '[name].functionObject.js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.functionObject.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
    it('Entry is string', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        options.entry = require('./paths.js').string;
        options.output.filename = '[name].string.js';
        runWebpack('entries', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'main.string.js'), 'utf8');
            expect(checkContent(content)).to.be.true;
            done();
        }, options);
    });
});
