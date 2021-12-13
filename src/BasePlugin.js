'use strict';

const { asyncHooks } = require('./hooks');
const ReplaceDependency = require('./ReplaceDependency');
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
        this.data = {};
    }

    plugin(obj, name, callback, options) {
        if (obj.hooks) {
            if (asyncHooks.includes(name))
                obj.hooks[name].tapAsync({
                    name: this.PLUGIN_NAME,
                    ...options,
                }, callback);
            else {
                obj.hooks[name].tap({
                    name: this.PLUGIN_NAME,
                    ...options,
                }, callback);
            }
        } else {
            name = name.replace(/([A-Z])/g, (m, $1) => '-' + $1.toLowerCase());
            obj.plugin(name, callback);
        }
    }

    apply(compiler) {
        this.plugin(compiler, 'environment', () => {
            if (this.RUNTIME_MODULES.length > 0)
                compiler.options.entry = utils.prependToEntry(this.RUNTIME_MODULES, compiler.options.entry, this.options.entries);
        });
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            const useLegacy = !('processAssets' in compilation.hooks);

            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            // When data are ready to replace
            if (!this.REPLACE_AFTER_OPTIMIZE_TREE) {
                this.plugin(compilation, 'afterOptimizeChunks', (chunks, chunkGroups) => this.replaceInModules(chunks, compilation));
                this.plugin(compilation, useLegacy ? 'optimizeExtractedChunks' : 'renderManifest', (chunks) => {
                    // `renderManifest` hook provides `RenderManifestEntries` instead of `Chunks`, so we need to map
                    if (!useLegacy)
                        chunks = chunks.map((entry) => entry.pathOptions.chunk);

                    this.replaceInExtractedModules(chunks, compilation);
                });
            } else {
                this.plugin(compilation, 'afterOptimizeTree', (chunks, modules) => this.replaceInModules(chunks, compilation));
                this.plugin(compilation, useLegacy ? 'optimizeChunkAssets' : 'processAssets', (compilationAssets, callback) => {
                    this.replaceInCSSAssets(compilation.chunks, compilation);
                    callback();
                }, !useLegacy && {
                    stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
                });
            }
        });
        this.plugin(compiler, 'compilation', (compilation, params) => {
            const { NormalModule } = compiler.webpack || { NormalModule: false };

            if (NormalModule) {
                NormalModule.getCompilationHooks(compilation).loader.tap(this.PLUGIN_NAME, (loaderContext, module) => {
                    loaderContext[this.PLUGIN_NAME] = this;
                });
            } else {
                this.plugin(compilation, 'normalModuleLoader', (loaderContext, module) => {
                    loaderContext[this.PLUGIN_NAME] = this;
                });
            }
        });
    }

    replaceInModules(chunks, compilation) {
        // Content of minCSSPlugin module is string type, which different from that of normal module
        const allModules = getAllModules(compilation);
        allModules.forEach((module) => {
            const identifier = module.identifier();
            if (/^css[\s|]+/g.test(identifier)) {
                if (module.content) {
                    const content = module.content;
                    module.content = this.replaceHolderToString(content);
                }
            } else if (this.MODULE_MARK ? module[this.MODULE_MARK] : true) {
                const source = module._source;
                let ranges = [];
                const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
                if (typeof source === 'string')
                    ranges = this.replaceHolderToRanges(source);
                else if (source instanceof Object && typeof source._value === 'string')
                    ranges = this.replaceHolderToRanges(source._value);
                if (ranges.length) {
                    if (replaceDependency)
                        replaceDependency.updateRanges(ranges);
                    else
                        module.addDependency(new ReplaceDependency(ranges));
                }
            }
        });
    }

    replaceInExtractedModules(chunks, compilation) {
        const chunkGraph = compilation.chunkGraph || false;
        chunks.forEach((chunk) => {
            let modules = [];

            if (chunkGraph) {
                modules = Array.from(chunkGraph.getChunkModulesIterable(chunk));
            } else {
                modules = !chunk.mapModules ? chunk._modules : chunk.mapModules();
            }

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
        const { webpack = false } = compilation.compiler;
        const ReplaceSource = webpack ? webpack.sources.ReplaceSource : require('webpack-sources').ReplaceSource;

        chunks.forEach((chunk) => {
            chunk.files.forEach((file) => {
                if (!file.endsWith('.css'))
                    return;
                // 处理css模块
                const source = compilation.assets[file];
                const replaceSource = new ReplaceSource(source);
                const ranges = this.replaceHolderToRanges(source.source());
                for (const range of ranges)
                    replaceSource.replace(range[0], range[1], range[2]);
                this.emitAsset(compilation, file, replaceSource);
            });
        });
    }

    /* eslint-disable new-cap, prefer-spread */
    replaceHolderToRanges(source) {
        const ranges = [];
        source.replace(this.REPLACER_RE, (...args) => {
            const m = args[0];
            const offset = +args[args.length - 2];
            const content = this.REPLACER_FUNC_ESCAPED(...args.slice(1, -2)) || m;
            ranges.push([offset, offset + m.length - 1, content]);
            return m;
        });
        return ranges;
    }

    replaceHolderToString(source) {
        const isBuff = source instanceof Buffer;

        if (isBuff)
            source = source.toString();

        source = source.replace(this.REPLACER_RE, (...args) => {
            const m = args[0];
            return this.REPLACER_FUNC(...args.slice(1, -2)) || m;
        });

        return isBuff ? Buffer.from(source) : source;
    }

    /**
     * @override
     * Replace Function
     * @TODO How about run a function `XXX('H3afwefa')`
     */
    REPLACER_FUNC(id) {
        return this.data[id] ? this.data[id].content : undefined;
    }

    /**
     * @override
     * Replace Function to escape
     */
    REPLACER_FUNC_ESCAPED(id) {
        return this.data[id] ? this.data[id].escapedContent : undefined;
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

    /**
     * @param {import('webpack').Compilation} compilation
     * @param {string} filename
     * @param {import('webpack-sources').SourceLike} source
     */
    emitAsset(compilation, filename, source) {
        const { webpack = false } = compilation.compiler;

        const isWebpack4 = !webpack || typeof compilation.compiler.resolvers !== 'undefined';

        if (!isWebpack4) {
            compilation.emitAsset(filename, source);
        } else {
            compilation.assets[filename] = source;
        }
    }
}

module.exports = BasePlugin;
