const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const expect = require('chai').expect;
const BasePlugin = require('../src/BasePlugin.js');
const getAllModules = require('../src/getAllModules.js');

const value = 'base';
const replaceReg = /BASE_PLUGIN\(([^)]*)\)/g;
let resultSource = '';

describe('Webpack Integration Tests: base', () => {
    const configPath = path.join('../test/cases/' + value + '/webpack.config.js');
    const outputDirectory = path.join('./cases/' + value + '/dest');
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
                if (this.MODULE_MARK ? module[this.MODULE_MARK] : true) {
                    const source = module._source;
                    if (typeof source === 'string')
                        resultSource = source;
                    else if (source instanceof Object && typeof source._value === 'string')
                        resultSource = source._value;
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
            const cssContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/bundle.js')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            expect(replaceReg.test(resultSource)).to.eql(false);
            done();
        });
    });
});
