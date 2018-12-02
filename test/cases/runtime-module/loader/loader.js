const loader = require('../../../../src/createLoader.js');
const postPlugin = require('./postcssPlugin.js');

// console.log(baseCssImageLoader);
module.exports = loader([postPlugin]);
