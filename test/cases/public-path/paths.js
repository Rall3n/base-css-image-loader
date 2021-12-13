module.exports = {
    http: {
        path: 'http://kaola.nos.netease.com/',
        result: /http:\/\/kaola.nos.netease.com\/test1.png\?2de3ba2cfcbe568802ba045f5c3c8ca9/g,
    },
    https: {
        path: 'https://kaola.nos.netease.com/',
        result: /https:\/\/kaola.nos.netease.com\/test1.png\?2de3ba2cfcbe568802ba045f5c3c8ca9/g,
    },
    path: {
        path: '//kaola.nos.netease.com/publish',
        result: /\/\/kaola.nos.netease.com\/publish\/test1.png\?2de3ba2cfcbe568802ba045f5c3c8ca9/g,
    },
    localPath: {
        path: '/publish/static',
        result: /\/publish\/static\/test1.png\?2de3ba2cfcbe568802ba045f5c3c8ca9/g,
    },
};

