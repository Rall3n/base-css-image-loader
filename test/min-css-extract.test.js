const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const webpack = require('webpack');
const BasePlugin = require('../src/BasePlugin');
const getAllModules = require('../src/getAllModules');

const value = 'min-css-extract';
const replaceReg = /BASE_PLUGIN\(([^)]*)\)/g;
let resultSource = '';

describe('Webpack Integration Test: base', () => {
    const configPath = path.join(`../test/cases/${value}/webpack.config.js`);
    const outputPath = path.join(`./cases/${value}/dest`);
    const options = require(configPath);
    for (const chunk of Object.keys(options.entry))
        options.entry[chunk] = path.join(__dirname, '/cases/', value, options.entry[chunk]);
    class TestPlugin extends BasePlugin {
        apply(compiler) {
            this.plugin(compiler, 'thisCompilation', (compilation, params) => {
                this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.afterOptimizeChunksCheck(chunks, compilation));
            });
        }

        afterOptimizeChunksCheck(chunks, compilation) {
            const allModules = getAllModules(compilation);
            allModules.forEach((module) => {
                const identifier = module.identifier();
                if (/^css[\s]+/g.test(identifier)) {
                    if (module.content) {
                        resultSource = module.content;
                    }
                }
            });
        }
    }

    options.plugins.push(new TestPlugin());

    it('#test webpack base case ' + value, (done) => {
        webpack(options, (err, stats) => {
            if (err)
                return done(err);
            if (stats.hasErrors())
                return done(new Error(stats.toString()));
            const cssContent = fs.readFileSync(path.resolve(__dirname, outputPath + '/bundle.css')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            expect(replaceReg.test(resultSource)).to.eql(false);
            done();
        });
    });
});
