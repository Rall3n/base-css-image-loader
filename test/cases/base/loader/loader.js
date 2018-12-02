const createLoader = require('../../../../src/createLoader.js');
const postPlugin = require('./postcssPlugin.js');

// console.log(baseCssImageLoader);
module.exports = createLoader([postPlugin]);
