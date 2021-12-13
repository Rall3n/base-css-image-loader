const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const runWebpack = require('../../fixtures/runWebpack');

describe('Webpack Integration Test: options', () => {
    it('options test', (done) => {
        runWebpack('options', undefined, (err, data) => {
            if (err)
                return done(err);
            const content = fs.readFileSync(path.resolve(data.outputPath, 'bundle.css'), 'utf8');
            expect(/\/\/kaola.nos.netease.com\/public\/test1-test.png\?2de3ba2cfcbe568802ba045f5c3c8ca9/g.test(content)).to.be.true;
            done();
        });
    });
});
