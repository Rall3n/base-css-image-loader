const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const runWebpack = require('../../fixtures/runWebpack');

describe('Webpack Integration Test: mini-css-extract-plugin', () => {
    it('should not remain IMAGE_PLACEHOLDER', (done) => {
        runWebpack('mini-css-extract-plugin', undefined, (err, data) => {
            if (err)
                return done(err);

            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.css'), 'utf8');
            expect(data.meta.REPLACER_RE.test(content)).to.be.false;
            done();
        });
    });
});
