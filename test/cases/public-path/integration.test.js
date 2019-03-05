const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const Plugin = require('./loader/Plugin');
const runWebpack = require('../../fixtures/runWebpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

describe('Webpack Integration Test: public path', () => {
    it('public path http', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const meta = require('./paths.js').http;
        const options = require(configPath);
        const plugin = new Plugin({
            publicPath: meta.path,
        });
        options.plugins = [];
        options.plugins.push(plugin);
        options.plugins.push(new MiniCssExtractPlugin({
            filename: '[name].http.css',
            chunkFilename: '[id].http.css',
        }));
        options.output.filename = '[name].http.js';
        runWebpack('public-path', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.http.css'), 'utf8');
            expect(meta.result.test(content)).to.be.true;
            done();
        }, options);
    });
    it('public path https', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        const meta = require('./paths.js').https;
        const plugin = new Plugin({
            publicPath: meta.path,
        });
        options.plugins = [];
        options.plugins.push(plugin);
        options.plugins.push(new MiniCssExtractPlugin({
            filename: '[name].https.css',
            chunkFilename: '[id].https.css',
        }));
        options.output.filename = '[name].https.js';
        runWebpack('public-path', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.https.css'), 'utf8');
            expect(meta.result.test(content)).to.be.true; done();
        }, options);
    });
    it('public path path', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        const meta = require('./paths.js').path;
        const plugin = new Plugin({
            publicPath: meta.path,
        });
        options.plugins = [];
        options.plugins.push(plugin);
        options.plugins.push(new MiniCssExtractPlugin({
            filename: '[name].path.css',
            chunkFilename: '[id].path.css',
        }));
        options.output.filename = '[name].path.js';
        runWebpack('public-path', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.path.css'), 'utf8');
            expect(meta.result.test(content)).to.be.true;
            done();
        }, options);
    });
    it('public path local path', (done) => {
        const configPath = path.resolve(__dirname, `./webpack.config.js`);
        const options = require(configPath);
        const meta = require('./paths.js').localPath;
        const plugin = new Plugin({
            publicPath: meta.path,
        });
        options.plugins = [];
        options.plugins.push(plugin);
        options.plugins.push(new MiniCssExtractPlugin({
            filename: '[name].localPath.css',
            chunkFilename: '[id].localPath.css',
        }));
        options.output.filename = '[name].localPath.js';
        runWebpack('public-path', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.localPath.css'), 'utf8');
            expect(meta.result.test(content)).to.be.true;
            done();
        }, options);
    });
});
