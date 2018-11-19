const postcss = require('postcss');
const reg = new RegExp(`url\\(["']?(.*?)["']?\\)`, 'g');

module.exports = postcss.plugin('parse-icon-font', ({ loaderContext }) => (styles, result) => {
    styles.walkDecls('background-image', (decl) => {
        const result = reg.exec(decl.value);
        if (result) {
            const url = result[1];
            decl.value = `IMAGE_PLACEHOLDER(${url})`;
            loaderContext._module.cssTestPluginMoudle = true;
        }
    });
});
