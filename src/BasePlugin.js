'use strict';

const { asyncHooks } = require('./hooks');
const ReplaceDependency = require('./ReplaceDependency');
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const utils = require('./utils');
const path = require('path');

class BasePlugin {
    constructor() {
        this.NAMESPACE = 'BasePlugin';
        this.MODULE_MARK = 'BasePluginModule';
        this.REPLACE_REG = /BASE_PLUGIN\(([^)]*)\)/g;

        this.options = {
            output: './',
            filename: '[fontName].[ext]?[hash]',
            publicPath: undefined,
        };
    }
    plugin(obj, name, callback) {
        if (obj.hooks) {
            if (asyncHooks.includes(name))
                obj.hooks[name].tapAsync(this.NAMESPACE, callback);
            else
                obj.hooks[name].tap(this.NAMESPACE, callback);
        } else {
            name = name.replace(/([A-Z])/g, (m, $1) => '-' + $1.toLowerCase());
            obj.plugin(name, callback);
        }
    }
    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.replaceInModules(chunks, compilation));
            this.plugin(compilation, 'optimizeExtractedChunks', (chunks) => this.replaceInExtractedModules(chunks));
        });
        this.plugin(compiler, 'compilation', (compilation, params) => {
            this.plugin(compilation, 'normalModuleLoader', (loaderContext, module) => {
                loaderContext.relevantPlugin = this;
            });
        });
    }

    replaceInModules(chunks, compilation) {
        // Content of minCSSPlugin module is string type, which different from that of normal module
        const allModules = getAllModules(compilation);
        allModules.forEach((module) => {
            const identifier = module.identifier();
            if (/^css[\s]+/g.test(identifier)) {
                if (module.content) {
                    const content = module.content;
                    module.content = this.replaceHolderToString(content);
                }
            } else if (this.MODULE_MARK ? module[this.MODULE_MARK] : true) {
                const source = module._source;
                let range = [];
                const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
                if (typeof source === 'string')
                    range = this.replaceHolderToRange(source);
                else if (source instanceof Object && typeof source._value === 'string')
                    range = this.replaceHolderToRange(source._value);
                if (range.length) {
                    if (replaceDependency)
                        replaceDependency.updateRange(range);
                    else
                        module.addDependency(new ReplaceDependency(range));
                }
            }
        });
    }
    replaceInExtractedModules(chunks) {
        chunks.forEach((chunk) => {
            const modules = !chunk.mapModules ? chunk._modules : chunk.mapModules();
            modules.filter((module) => '_originalModule' in module).forEach((module) => {
                const source = module._source;
                if (typeof source === 'string')
                    module._source = this.replaceHolderToString(source);
                else if (source instanceof Object && typeof source._value === 'string')
                    source._value = this.replaceHolderToString(source._value);
            });
        });
    }
    /**
     * @override
     * @param {string} source - Source to replace
     */
    replaceHolderToRange(source) {
        const range = [];
        source.replace(this.REPLACE_REG, (m, hash, offset) => {
            if (this.data[hash]) {
                const content = this.data[hash].escapedContent;
                range.push([offset, offset + m.length - 1, content]);
            }
            return m;
        });
        return range;
    }
    /**
     * @override
     * @param {string} source - Source to replace
     */
    replaceHolderToString(source) {
        return source.replace(this.REPLACE_REG, (m, hash) => this.data[hash].content || m);
    }

    getOutputFileName(options) {
        return utils.createFileName(this.options.filename, options);
    }
    getOutputPath(fileName) {
        return path.join(this.options.output, fileName);
    }
    getOutputURL(fileName, compilation) {
        const urlPath = this.options.output;
        let url = '/';
        if (this.options.publicPath)
            url = utils.urlResolve(this.options.publicPath, fileName);
        else
            url = utils.urlResolve(compilation.options.output.publicPath || '', path.join(urlPath, fileName));
        if (path.sep === '\\')
            url = url.replace(/\\/g, '/');
        return url;
    }
    /**
     * Get output info by fileName options
     * @param {Object} options
     * @param {*} compilation
     */
    getOutput(options, compilation) {
        const fileName = this.getOutputFileName(options);
        const path = this.getOutputPath(fileName);
        const url = this.getOutputURL(fileName, compilation);
        return { fileName, path, url };
    }
}

module.exports = BasePlugin;
