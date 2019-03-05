const BasePlugin = require('../../../../src/BasePlugin.js');
const meta = require('./meta');
const path = require('path');

class SubCSSImagePlugin extends BasePlugin {
    constructor(options) {
        super();
        this.NAMESPACE = 'TestPlugin';
        this.MODULE_MARK = 'isTestModule';
        this.REPLACE_REG = /PLACEIMAGE\(([^)]*)\)/g;
        this.options = Object.assign({
            output: './',
            filename: '[name].[ext]?[hash]',
            publicPath: undefined,
        }, options);
        Object.assign(this, meta);
    }

    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.afterOptimizeChunks(chunks, compilation));
        });
        super.apply(compiler);
    }

    afterOptimizeChunks(chunks, compilation) {
        for (const key in this.data) {
            this.data[key].content = `url('${this.getOutput({
                name: 'test1',
                fontName: 'test1',
                ext: 'png',
                content: 'wewedwedwesdwewewe',
            }, compilation).url}')`;
            this.data[key].escapedContent = this.data[key].content;
        }
    }
}

module.exports = SubCSSImagePlugin;

