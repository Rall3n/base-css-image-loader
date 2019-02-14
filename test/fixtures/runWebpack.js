const path = require('path');
const webpack = require('webpack');

module.exports = function runWebapck(caseName, preprocess, done) {
    const cwdPath = path.resolve(__dirname, `../cases/${caseName}`);
    process.chdir(cwdPath);

    const configPath = path.resolve(cwdPath, `webpack.config.js`);
    const outputPath = path.resolve(cwdPath, `dest`);

    const options = require(configPath);
    preprocess && preprocess(options);

    webpack(options, (err, stats) => {
        if (err)
            return done(err);
        if (stats.hasErrors())
            return done(new Error(stats.toString()));

        done(undefined, {
            configPath,
            outputPath,
            meta: require('./subLoader/meta'),
            options,
        });
    });
};
