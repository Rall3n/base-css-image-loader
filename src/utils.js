'use strict';

const crypto = require('crypto');
const url = require('url');
const path = require('path');
const loaderUtils = require('loader-utils');

module.exports = {
    md5Create(stream) {
        const md5 = crypto.createHash('md5');
        md5.update(stream);
        return md5.digest('hex');
    },
    urlResolve(base, urlPath) {
        if (path.sep === '\\')
            urlPath = urlPath.replace(/\\/g, '/');
        if (base && base[base.length - 1] !== '/')
            base = base + '/';
        return url.resolve(base, urlPath);
    },
    createFileName(placeholder, data) {
        if (data.content) {
            placeholder = placeholder.replace(/\[(?:(\w+):)?hash(?::([a-z]+\d*))?(?::(\d+))?\]/ig, (all, hashType, digestType, maxLength) =>
                loaderUtils.getHashDigest(data.content, hashType, digestType, parseInt(maxLength)));
            delete data.content;
        }
        return placeholder.replace(/\[([^[]*)\]/g, ($1, $2) => data[$2] || $1);
    },
};
