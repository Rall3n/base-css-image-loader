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
            expect(/\/\/kaola.nos.netease.com\/public\/test1-test.png\?eb5f43c64990934cf3a32ab5fbe51558/g.test(content)).to.be.true;
            done();
        });
    });
});
