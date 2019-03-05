module.exports = {
    http: {
        path: 'http://kaola.nos.netease.com/',
        result: /http:\/\/kaola.nos.netease.com\/test1.png\?eb5f43c64990934cf3a32ab5fbe51558/g,
    },
    https: {
        path: 'https://kaola.nos.netease.com/',
        result: /https:\/\/kaola.nos.netease.com\/test1.png\?eb5f43c64990934cf3a32ab5fbe51558/g,
    },
    path: {
        path: '//kaola.nos.netease.com/publish',
        result: /\/\/kaola.nos.netease.com\/publish\/test1.png\?eb5f43c64990934cf3a32ab5fbe51558/g,
    },
    localPath: {
        path: '/publish/static',
        result: /\/publish\/static\/test1.png\?eb5f43c64990934cf3a32ab5fbe51558/g,
    },
};

