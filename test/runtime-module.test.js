const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const expect = require('chai').expect;
const utils = require('../src/utils');
const BasePlugin = require('../src/BasePlugin.js');

const value = 'runtime-module';
const replaceReg = /console.log\('run time module'\)/g;
let runResult = {};

describe('Webpack Integration Test: runtime-module', () => {
    const configPath = path.join('../test/cases/' + value + '/webpack.config.js');
    const outputDirectory = path.join('./cases/' + value + '/dest');
    const options = require(configPath);

    class TestChunck extends BasePlugin {
        // check run time module path add to entry success
        constructor(options) {
            super();
        }

        apply(compiler) {
            this.plugin(compiler, 'environment', () => {
                runResult = compiler.options.entry;
            });
            super.apply(compiler);
        }
    }
    options.plugins.push(new TestChunck());
    it('#test webpack runtime module case ' + value, (done) => {
        webpack(options, (err, stats) => {
            if (err)
                return done(err);
            if (stats.hasErrors())
                return done(new Error(stats.toString()));
            const insertPath = path.resolve(__dirname, './cases/runtime-module/insert.js');
            const cssContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/bundle.js')).toString();
            expect(replaceReg.test(cssContent)).to.eql(true);
            expect(runResult).to.eql({
                bundle: [insertPath, path.resolve(__dirname, './cases/runtime-module/index.js')],
            });
            done();
        });
    });
});
