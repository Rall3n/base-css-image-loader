const getPlugin = require('../../../../src/plugin.js');

module.exports = getPlugin('cssTestPlugin', {
    init(options) {
        this.replaceReg = /IMAGE_PLACEHOLDER\(([^)]*)\)/g;
    },
    apply() {
        // apply function
    },
    afterOptimizeChunks() {
        this.data = {
            '/image/test/test.1.png': 'url(/image/script.png)',
            '/image/test/test.2.png': 'url(/image/script-2.png)',
            '/image/test/test.3.png': 'url(/image/script.png)',
        };
    },
});
