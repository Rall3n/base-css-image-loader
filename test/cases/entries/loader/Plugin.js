const BasePlugin = require('../../../../src/BasePlugin.js');
const meta = require('./meta');
const path = require('path');

class SubCSSImagePlugin extends BasePlugin {
    constructor() {
        super();
        Object.assign(this, meta);
    }

    apply(compiler) {
        this.plugin(compiler, 'environment', () => {
            const modulePath = path.resolve(__dirname, './anotherModule.js');
            this.RUNTIME_MODULES.push(modulePath);
        });
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.afterOptimizeChunks(chunks));
        });
        super.apply(compiler);
    }

    afterOptimizeChunks() {
        for (const key in this.data)
            this.data[key].escapedContent = this.data[key].content;
    }
}

module.exports = SubCSSImagePlugin;

