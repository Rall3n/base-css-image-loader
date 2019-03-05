const postcss = require('postcss');
const meta = require('./meta');
const urlRE = /url\(["']?(.*?)["']?\)/;

module.exports = postcss.plugin('sub-css-image', ({ loaderContext }) => (styles, result) => {
    const plugin = loaderContext[meta.PLUGIN_NAME];
    const data = plugin.data;

    styles.walkDecls('background-image', (decl) => {
        const found = decl.value.match(urlRE);
        if (found) {
            const url = found[1];
            decl.value = `${meta.REPLACER_NAME}(${url})`;

            const content = url.replace('test1');
            data[url] = {
                content,
                escapedContent: content,
            };
            loaderContext._module[meta.MODULE_MARK] = true;
        }
    });
    loaderContext._module.isTestModule = true;
});
