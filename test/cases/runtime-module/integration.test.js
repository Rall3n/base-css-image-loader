const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const runWebpack = require('../../fixtures/runWebpack');

describe('Webpack Integration Test: runtime-module', () => {
    it('should have inserted content', (done) => {
        runWebpack('runtime-module', undefined, (err, data, compiler) => {
            if (err)
                return done(err);

            expect(compiler.options.entry).to.eql({
                bundle: [
                    path.resolve(data.cwdPath, 'insert.js'),
                    './index.js',
                ],
            });

            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.js'), 'utf8');
            expect(content.includes("console.log('runtime-module')")).to.be.true;

            done();
        });
    });
});

