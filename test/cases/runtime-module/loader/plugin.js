const BasePlugin = require('../../../../src/BasePlugin.js');
const path = require('path');

class RuntimeCheck extends BasePlugin {
    constructor(options) {
        options = options || {};
        super();
    }
    apply(compiler) {
        const insertPath = path.resolve(__dirname, '../insert.js');
        this.plugin(compiler, 'environment', () => {
            this.RUNTIME_MODULES = [insertPath];
        });
        super.apply(compiler);
    }
}
module.exports = RuntimeCheck;
