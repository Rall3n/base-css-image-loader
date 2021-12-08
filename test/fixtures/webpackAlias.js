const moduleAlias = require('module-alias');

const webpackAlias = (version = '5', callback, additonalAliases = []) => {
    moduleAlias.reset();

    const suffix = version === '5' ? '' : '-' + version;

    const aliases = {
        webpack: `webpack${suffix}`,
    };

    additonalAliases.forEach((key) => {
        aliases[key] = `${key}${suffix}`;
    });

    moduleAlias.addAliases(aliases);

    if (callback) {
        callback();
        moduleAlias.reset();
    }
};

module.exports = webpackAlias;
