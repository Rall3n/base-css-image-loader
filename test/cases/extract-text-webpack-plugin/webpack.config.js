const loaderPath = require.resolve('../../fixtures/subLoader/loader');
const Plugin = require('../../fixtures/subLoader/Plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    // mode: 'development',
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
        rules: [{
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader', loaderPath],
            }),
        }],
    },
    plugins: [
        new Plugin(),
        new ExtractTextPlugin('index.css'),
    ],
};
