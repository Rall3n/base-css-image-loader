const path = require('path');
const webpack = require('webpack');

module.exports = function runWebpack(caseName, options = {}, done) {
    const casesPath = options.casesPath || path.resolve(__dirname, '../cases');
    const casePath = path.resolve(casesPath, caseName);
    process.chdir(casePath);

    const configPath = path.resolve(casePath, `webpack.config.js`);
    const outputPath = path.resolve(casePath, `dest`);

    const webpackOptions = options.webpackConfig || require(configPath);
    options.preprocess && options.preprocess(webpackOptions);

    // for (const chunk of Object.keys(options.entry))
    //     options.entry[chunk] = path.resolve(casePath, options.entry[chunk]);

    const compiler = webpack(webpackOptions);
    compiler.run((err, stats) => {
        if (err)
            return done(err);
        if (stats.hasErrors())
            return done(new Error(stats.toString()));
        done(undefined, {
            casePath,
            configPath,
            outputPath,
            meta: require('./subLoader/meta'),
            webpackOptions,
        }, compiler);
    });
};
