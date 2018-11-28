'use strict';

const postcss = require('postcss');

module.exports = function createLoader(plugins) {
    return function (source, meta) {
        const callback = this.async();
        this.cacheable();

        const options = {
            to: this.resourcePath,
            from: this.resourcePath,
        };
        if (meta && meta.sourceRoot && meta.mappings) {
            options.map = {
                prev: meta,
                inline: false,
                annotation: false,
            };
        }

        const pluginList = plugins.map((plugin) => plugin({ loaderContext: this }));
        postcss(pluginList).process(source, options).then((result) => {
            const map = result.map && result.map.toJSON();
            callback(null, result.css, map);
            return null;
        }).catch((error) => {
            callback(error);
        });
    };
};
