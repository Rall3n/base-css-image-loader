'use strict';

const { compilerHooks, asyncHooks, compilationHooks } = require('./event.js');
const ReplaceDependency = require('./replaceDependency.js');
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const utils = require('./utils');
const path = require('path');

module.exports = (NAMESPACE, plugin) => class Plugin {
    constructor(options) {
        this.data = {};
        this.options = Object.assign({
            output: './',
            filename: '[name].[ext]?[hash]',
            publicPath: undefined,
        }, options);
        if (plugin.init instanceof Function)
            plugin.init.call(this, options);
    }
    apply(compiler) {
        for (const hook of compilerHooks) {
            if (plugin[hook] instanceof Function)
                this.plugin(compiler, hook, plugin[hook].bind(this));
        }
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
            compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
            for (const hook of compilationHooks) {
                if (plugin[hook] instanceof Function)
                    this.plugin(compilation, hook, plugin[hook].bind(this));
            }
            compilation.hooks.afterOptimizeChunks.tap(NAMESPACE, (chunks) => this.afterOptimizeChunks(chunks, compilation));
        });
        if (plugin.apply instanceof Function)
            plugin.apply.call(this, compiler);
    }
    plugin(obj, name, callBack) {
        if (obj.hooks) {
            if (asyncHooks.indexOf(name) !== -1)
                obj.hooks[name].tapAsync(NAMESPACE, callBack);
            else
                obj.hooks[name].tap(NAMESPACE, callBack);
        } else {
            name = name.match(/([A-Z]{0,1}[a-z]*)/g).filter((item, index) => item !== '').map((item) => item.toLowerCase()).join('-');
            obj.plugin(name, callBack);
        }
    }
    afterOptimizeChunks(chunks, compilation) {
        const data = this.data;
        const allModules = getAllModules(compilation);
        const replaceReg = this.replaceReg;
        allModules.filter((module) => {
            // hack for min-css-extract-plugin, this plugin's identifier start with 'css'
            const identifier = module.identifier();
            if (/^css[\s]+/g.test(identifier)) {
                module.thisModuleIsCssModule = true;
                return true;
            }
            return module[NAMESPACE + 'Moudle'];
        }).forEach((module) => {
            if (module.thisModuleIsCssModule && module.content) {
                const content = module.content;
                module.content = this.replaceStringHolder(content, replaceReg, data);
            } else {
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
            }
        });
    }
    optimizeExtractedChunks(chunks) {
        const data = this.data;
        const replaceReg = this.replaceReg;
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
        return value.replace(replaceReg, ($1, $2) => data[$2] || $1);
    }
    replaceHolder(value, replaceReg, data) {
        const rangeList = [];
        const haveChecked = [];
        value.replace(replaceReg, ($1, $2) => {
            if (data[$2] && haveChecked.indexOf($1) === -1) {
                haveChecked.push($1);
                const content = data[$2];
                let index = value.indexOf($1);
                while (index !== -1) {
                    rangeList.push([index, index + $1.length - 1, content]);
                    index = value.indexOf($1, index + 1);
                }
            }
            return $1;
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
