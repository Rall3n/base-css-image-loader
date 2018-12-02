const BasePlugin = require('../../../../src/BasePlugin.js');
const getAllModules = require('../../../../src/getAllModules.js');

class CssTestPlugin extends BasePlugin {
    constructor() {
        super();
        this.NAMESPACE = 'CssTestPlugin';
        this.MODULE_MARK = 'CssTestPluginMoudle';
        this.REPLACE_REG = /IMAGE_PLACEHOLDER\(([^)]*)\)/g;
    }
    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.afterOptimizeChunks(chunks, compilation));
        });
        super.apply(compiler);
    }
    afterOptimizeChunks() {
        this.data = {
            '/image/test/test.1.png': {
                escapedContent: 'url(/image/script.png)',
            },
            '/image/test/test.2.png': {
                escapedContent: 'url(/image/script-2.png)',
            },
            '/image/test/test.3.png': {
                escapedContent: 'url(/image/script.png)',
            },
        };
    }
}

module.exports = CssTestPlugin;

