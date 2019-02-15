const createLoader = require('../../../../src/createLoader');
const postcssPlugin = require('./postcssPlugin');

module.exports = createLoader([postcssPlugin]);
