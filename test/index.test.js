const webpackAlias = require('./fixtures/webpackAlias');

webpackAlias(process.env.WEBPACK_VERSION);

require('./unit.test.js');
require('./integration.test.js');
