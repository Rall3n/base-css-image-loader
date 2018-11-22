'use strict';

const { asyncHooks } = require('./event.js');
const NullFactory = require('webpack/lib/NullFactory');
const ReplaceDependency = require('./ReplaceDependency');
const getAllModules = require('./getAllModules');
const utils = require('./utils');
const path = require('path');

class BasePlugin {
    constructor(options) {
        this.NAMESPACE = 'BasePlugin';
        this.MODULE_MARK = 'BasePluginModule';
        this.REPLACE_REG = /test/;

        this.options = Object.assign({
            output: './',
            filename: '[fontName].[ext]?[hash]',
            publicPath: undefined,
        }, options);

        // @TODO
    }

    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation) => {
            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.afterOptimizeChunks(chunks, compilation));
        });
        return this;
    }

    plugin(obj, name, callback) {
        if (obj.hooks) {
            if (asyncHooks.includes(name))
                obj.hooks[name].tapAsync(this.NAMESPACE, callback);
            else
                obj.hooks[name].tap(this.NAMESPACE, callback);
        } else {
            name = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
            obj.plugin(name, callback);
        }
    }

    afterOptimizeChunks(chunks, compilation) {
        const data = this.data;
        const allModules = getAllModules(compilation);
        allModules.filter((module) => {
            // hack for min-css-extract-plugin, this plugin's identifier start with 'css'
            const identifier = module.identifier();
            if (/^css[\s]+/g.test(identifier)) {
                module.isCSSModule = true;
                return true;
            }
            if (this.MODULE_MARK) {
                return module[this.MODULE_MARK];
            }
            return true;
        }).forEach((module) => {
            if (module.isCSSModule && module.content) {
                module.content = this.replaceStringHolder(module.content, this.REPLACE_REG, data);
            } else {
                const source = module._source;
                let range = [];
                const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
                if (typeof source === 'string') {
                    range = this.replaceHolder(source, this.REPLACE_REG, data);
                } else if (source instanceof Object && typeof source._value === 'string') {
                    range = this.replaceHolder(source._value, this.REPLACE_REG, data);
                }
                if (range.length > 0) {
                    if (replaceDependency) {
                        replaceDependency.updateRange(range);
                    } else {
                        module.addDependency(new ReplaceDependency(range));
                    }
                }
            }
        });
    }

    optimizeExtractedChunks(chunks) {
        const data = this.data;
        chunks.forEach((chunk) => {
            const modules = !chunk.mapModules ? chunk._modules : chunk.mapModules();
            modules.filter((module) => '_originalModule' in module).forEach((module) => {
                const source = module._source;
                if (typeof source === 'string') {
                    module._source = this.replaceStringHolder(source, this.REPLACE_REG, data);
                } else if (source instanceof Object && typeof source._value === 'string') {
                    source._value = this.replaceStringHolder(source._value, this.REPLACE_REG, data);
                }
            });
        });
    }

    replaceStringHolder(value, re, data) {
        return value.replace(re, (m, $1) => data[$1] || m);
    }

    replaceHolder(value, re, data) {
        const rangeList = [];
        const haveChecked = [];
        value.replace(re, (m, $1) => {
            if (data[$1] && !haveChecked.includes(m)) {
                haveChecked.push(m);
                const content = data[$1];
                let index = value.indexOf(m);
                while (index !== -1) {
                    rangeList.push([index, index + m.length - 1, content]);
                    index = value.indexOf(m, index + 1);
                }
            }
            return m;
        });
        return rangeList;
    }

    getFileName(options) {
        return utils.createFileName(this.options.filename, options);
    }

    getFilePath(filename, compilation) {
        const urlPath = this.options.output;
        let url = '/';
        if (this.options.publicPath)
            url = utils.urlResolve(this.options.publicPath, filename);
        else
            url = utils.urlResolve(compilation.options.output.publicPath || '', path.join(urlPath, filename));
        if (path.sep === '\\')
            url = url.replace(/\\/g, '/');
        return url;
    }
}

module.exports = BasePlugin;
