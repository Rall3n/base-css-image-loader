const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const runWebpack = require('../../fixtures/runWebpack');

describe('Webpack Integration Test: runtime-module', () => {
    it('should have inserted content', (done) => {
        runWebpack('runtime-module', undefined, (err, data, compiler) => {
            if (err)
                return done(err);

            const equal = {
                bundle: [
                    path.resolve(__dirname, 'insert.js'),
                    './index.js',
                ],
            };

            expect(compiler.options.entry).to.eql(('webpack' in compiler) ? {
                bundle: {
                    import: equal.bundle,
                },
            } : equal);

            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.js'), 'utf8');
            expect(content.includes("console.log('runtime-module')")).to.be.true;

            done();
        });
    });
});

