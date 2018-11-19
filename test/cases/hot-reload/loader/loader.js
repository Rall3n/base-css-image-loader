const loader = require('../../../../src/loader.js');
const postPlugin = require('./postcssPlugin.js');

// console.log(baseCssImageLoader);
module.exports = loader([postPlugin]);
