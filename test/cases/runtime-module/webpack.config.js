const loaderPath = require.resolve('./loader/loader');
const Plugin = require('./loader/Plugin');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
        publicPath: 'dest/',
    },
    module: {
        rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader', loaderPath] }],
    },
    plugins: [
        new Plugin(),
    ],
};
