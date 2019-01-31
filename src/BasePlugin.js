'use strict';

const { asyncHooks } = require('./hooks');
const ReplaceDependency = require('./ReplaceDependency');
const ReplaceSource = require('webpack-sources').ReplaceSource;
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const utils = require('./utils');
const path = require('path');

class BasePlugin {
    constructor() {
        this.PLUGIN_NAME = 'basePlugin';
        this.MODULE_MARK = 'isBasePluginModule';
        this.REPLACER_NAME = 'BASE_PLUGIN';
        this.REPLACER_RE = /BASE_PLUGIN\(([^)]*)\)/g;
        // this.REPLACER_FUNC = ...;
        // this.REPLACER_FUNC_ESCAPED = ...;
        this.REPLACE_AFTER_OPTIMIZE_TREE = false;
        this.RUNTIME_MODULES = [];

        this.options = {
            output: './',
            filename: '[name].[ext]?[hash]',
            publicPath: undefined,
        };
    }

    plugin(obj, name, callback) {
        if (obj.hooks) {
            if (asyncHooks.includes(name))
                obj.hooks[name].tapAsync(this.PLUGIN_NAME, callback);
            else
                obj.hooks[name].tap(this.PLUGIN_NAME, callback);
        } else {
            name = name.replace(/([A-Z])/g, (m, $1) => '-' + $1.toLowerCase());
            obj.plugin(name, callback);
        }
    }

    apply(compiler) {
        this.plugin(compiler, 'environment', () => {
            if (this.RUNTIME_MODULES.length > 0)
                compiler.options.entry = utils.prependEntry(this.RUNTIME_MODULES, compiler.options.entry);
        });
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            // When data are ready to replace
            if (!this.REPLACE_AFTER_OPTIMIZE_TREE) {
                this.plugin(compilation, 'afterOptimizeChunks', (chunks, chunkGroups) => this.replaceInModules(chunks, compilation));
                this.plugin(compilation, 'optimizeExtractedChunks', (chunks) => this.replaceInExtractedModules(chunks));
            } else {
                this.plugin(compilation, 'afterOptimizeTree', (chunks, modules) => this.replaceInModules(chunks, compilation));
                this.plugin(compilation, 'optimizeChunkAssets', (chunks, callback) => {
                    this.replaceInCSSAssets(chunks, compilation);
                    callback();
                });
            }
        });
        this.plugin(compiler, 'compilation', (compilation, params) => {
            this.plugin(compilation, 'normalModuleLoader', (loaderContext, module) => {
                loaderContext[this.PLUGIN_NAME] = this;
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

    replaceInCSSAssets(chunks, compilation) {
        chunks.forEach((chunk) => {
            chunk.files.forEach((file) => {
                if (!file.endsWith('.css'))
                    return;
                // 处理css模块
                const source = compilation.assets[file];
                let content = compilation.assets[file].source();
                content = this.replaceHolderToString(content);
                const replaceSource = new ReplaceSource(source);
                replaceSource.replace(0, source.size(), content);
                compilation.assets[file] = replaceSource;
            });
        });
    }

    /* eslint-disable new-cap, prefer-spread */
    replaceHolderToRange(source) {
        const range = [];
        source.replace(this.REPLACER_RE, (...args) => {
            const m = args[0];
            const offset = +args[args.length - 2];
            const content = this.REPLACER_FUNC_ESCAPED(...args.slice(1, -2)) || m;
            range.push([offset, offset + m.length - 1, content]);
            return m;
        });
        return range;
    }

    replaceHolderToString(source) {
        return source.replace(this.REPLACER_RE, (...args) => {
            const m = args[0];
            return this.REPLACER_FUNC(...args.slice(1, -2)) || m;
        });
    }

    /**
     * @override
     * Replace Function
     * @TODO How about run a function `XXX('H3afwefa')`
     */
    REPLACER_FUNC(id) {
        return this.data[id].content;
    }

    /**
     * @override
     * Replace Function to escape
     */
    REPLACER_FUNC_ESCAPED(id) {
        return this.data[id].escapedContent;
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
