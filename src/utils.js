'use strict';

const crypto = require('crypto');
const url = require('url');
const path = require('path');
const loaderUtils = require('loader-utils');

const utils = {
    genMD5(stream) {
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
    /**
     * Prepend an entry or entries to webpack option
     */
    prependEntry(filePaths, entry) {
        if (typeof filePaths === 'string')
            filePaths = [filePaths];

        if (typeof entry === 'string')
            return [].concat(filePaths, [entry]);
        else if (Array.isArray(entry))
            return [].concat(filePaths, entry);
        else if (typeof entry === 'object') {
            Object.keys(entry).forEach((key) => {
                entry[key] = utils.prependEntry(filePaths, entry[key]);
            });
            return entry;
        } else if (typeof entry === 'function') {
            return function () {
                return Promise.resolve(entry()).then((entry) => utils.prependEntry(filePaths, entry));
            };
        } else
            throw new TypeError('Error entry type: ' + typeof entry);
    },
    /**
     * Escape string
     * @param {string} string to escape
     */
    escape(string) {
        return string.replace(/[\\'"]/g, '\\$&');
    },
};

module.exports = utils;
