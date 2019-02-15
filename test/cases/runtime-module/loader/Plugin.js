const path = require('path');
const BasePlugin = require('../../../../src/BasePlugin');
const meta = require('./meta');

class RuntimeModulePlugin extends BasePlugin {
    constructor() {
        super();
        Object.assign(this, meta);
    }

    apply(compiler) {
        const insertPath = path.resolve(__dirname, '../insert.js');
        this.plugin(compiler, 'environment', () => {
            this.RUNTIME_MODULES = [insertPath];
        });
        super.apply(compiler);
    }
}

module.exports = RuntimeModulePlugin;
