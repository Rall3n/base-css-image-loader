'use strict';

const { asyncHooks } = require('./hooks.js');
const ReplaceDependency = require('./replaceDependency.js');
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const utils = require('./utils');
const path = require('path');

module.exports = class BasePlugin {
    constructor() {
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
            name = name.replace(/([A-Z])/g, (m, $1) => `-${$1.toLowerCase()}`);
            obj.plugin(name, callback);
        }
    }
    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            this.plugin(compilation, 'afterOptimizeChunks', (chunks) => this.replaceModule(chunks, compilation));
            this.plugin(compilation, 'optimizeExtractedChunks', (chunks) => this.replaceExtractedModule(chunks));
        });
    }

    replaceModule(chunks, compilation) {
        // minCssPlugin's module's content is string, and is different from normal module source value
        const data = this.data;
        const strData = this.strData;
        const allModules = getAllModules(compilation);
        if (data)
            this.replaceInModule(allModules, data);
        if (strData)
            this.replaceMinCssModule(allModules, strData);
    }
    replaceInModule(modules, data) {
        const replaceReg = this.REPLACEREG;
        modules.filter((module) => {
            const identifier = module.identifier();
            // mincssModule is not normal module;
            if (/^css[\s]+/g.test(identifier)) {
                return false;
            }
            if (this.MODULEMARK) {
                return module[this.MODULEMARK];
            }
            return true;
        }).forEach((module) => {
            const source = module._source;
            let range = [];
            const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
            if (typeof source === 'string') {
                range = this.replaceHolder(source, replaceReg, data);
            } else if (source instanceof Object && typeof source._value === 'string') {
                range = this.replaceHolder(source._value, replaceReg, data);
            }
            if (range.length > 0) {
                if (replaceDependency) {
                    replaceDependency.updateRange(range);
                } else {
                    module.addDependency(new ReplaceDependency(range));
                }
            }
        });
    }
    replaceMinCssModule(modules, data) {
        const replaceReg = this.REPLACEREG;
        modules.filter((module) => {
            const identifier = module.identifier();
            if (/^css[\s]+/g.test(identifier)) {
                return true;
            }
            return false;
        }).forEach((module) => {
            if (module.content) {
                const content = module.content;
                module.content = this.replaceStringHolder(content, replaceReg, data);
            }
        });
    }
    replaceExtractedModule(chunks) {
        const replaceReg = this.REPLACEREG;
        const data = this.strData;
        chunks.forEach((chunk) => {
            const modules = !chunk.mapModules ? chunk._modules : chunk.mapModules();
            modules.filter((module) => '_originalModule' in module).forEach((module) => {
                const source = module._source;
                if (typeof source === 'string') {
                    module._source = this.replaceStringHolder(source, replaceReg, data);
                } else if (source instanceof Object && typeof source._value === 'string') {
                    source._value = this.replaceStringHolder(source._value, replaceReg, data);
                }
            });
        });
    }
    replaceStringHolder(value, replaceReg, data) {
        return value.replace(replaceReg, (m, $2) => data[$2] || m);
    }
    replaceHolder(value, replaceReg, data) {
        const rangeList = [];
        const haveChecked = [];
        value.replace(replaceReg, (m, $2) => {
            if (data[$2] && haveChecked.indexOf(m) === -1) {
                haveChecked.push(m);
                const content = data[$2];
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
    getFilePath(fileName, compilation) {
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
};
