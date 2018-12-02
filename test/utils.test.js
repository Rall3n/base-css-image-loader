/**
 * test attribute function in plugin Object
 */
const fs = require('fs');
const path = require('path');
const utils = require('../src/utils.js');
const expect = require('chai').expect;

describe('icon font plugin api test:', () => {
    const file = fs.readFileSync(path.resolve(__dirname, './files/index.css'));
    it('#function resolve url test: ', (done) => {
        const urlList = [
            ['http://nos.163.com/cloud/public', '/font/icon-font.eot', 'http://nos.163.com/font/icon-font.eot'],
            ['http://nos.163.com/cloud/public', 'font/icon-font.eot', 'http://nos.163.com/cloud/public/font/icon-font.eot'],
            ['http://nos.163.com/cloud/public/', 'font/icon-font.eot', 'http://nos.163.com/cloud/public/font/icon-font.eot'],
            ['/public/', 'font/icon-font.eot', '/public/font/icon-font.eot'],
            ['/public/', '../font/icon-font.eot', '/font/icon-font.eot'],
            ['/public/', '/font/icon-font.eot', '/font/icon-font.eot'],
            ['/public', 'font/icon-font.eot', '/public/font/icon-font.eot'],
            ['/public', '/font/icon-font.eot', '/font/icon-font.eot'],
            ['public', 'font/icon-font.eot', 'public/font/icon-font.eot'],
            ['public', '/font/icon-font.eot', '/font/icon-font.eot'],
            ['public/', 'font/icon-font.eot', 'public/font/icon-font.eot'],
            ['public/', '/font/icon-font.eot', '/font/icon-font.eot'],
            ['', 'font/icon-font.eot', 'font/icon-font.eot'],
            ['.', 'font/icon-font.eot', 'font/icon-font.eot'],
        ];
        urlList.forEach((urls) => {
            const resultEql = urls[2];
            const result = utils.urlResolve(urls[0], urls[1]);
            expect(result).to.eql(resultEql);
        });
        done();
    });
    it('#function create fileName test: ', (done) => {
        const fileNames = [
            ['[fileName].[ext]?[hash]', { fileName: 'demo', ext: 'css', content: file }, 'demo.css?c9aeb5d4dd143239245ae870812d00dd'],
            ['[fileName]_[hash].[ext]', { fileName: 'demo', ext: 'css', content: file }, 'demo_c9aeb5d4dd143239245ae870812d00dd.css'],
            ['[fileName].[hash].[ext]', { fileName: 'demo', ext: 'css', content: file }, 'demo.c9aeb5d4dd143239245ae870812d00dd.css'],
        ];
        fileNames.forEach((fileOptions) => {
            const resultEql = fileOptions[2];
            const result = utils.createFileName(fileOptions[0], fileOptions[1]);
            expect(result).to.eql(resultEql);
        });
        done();
    });
    it('#function create file hash: ', (done) => {
        const hash = utils.genMD5(file);
        expect(hash).to.eql('c9aeb5d4dd143239245ae870812d00dd');
        done();
    });
    it('#function add webpack runtime module: ', (done) => {
        const prependEntryList = [
            [
                ['./test.js'],
                './app/entry',
                ['./test.js', './app/entry'],
            ],
            [
                ['./test.0.js', './test.js'],
                './app/entry',
                ['./test.0.js', './test.js', './app/entry'],
            ],
            [
                './test.js',
                './app/entry',
                ['./test.js', './app/entry'],
            ],
            [
                './test.js',
                ['./app/entry'],
                ['./test.js', './app/entry'],
            ],
            [
                './test.js',
                {
                    a: './app/entry-a',
                    b: ['./app/entry-b1', './app/entry-b2'],
                },
                {
                    a: ['./test.js', './app/entry-a'],
                    b: ['./test.js', './app/entry-b1', './app/entry-b2'],
                },
            ],
        ];
        prependEntryList.forEach((fileOptions) => {
            const resultEql = fileOptions[2];
            const result = utils.prependEntry(fileOptions[0], fileOptions[1]);
            expect(result).to.eql(resultEql);
        });
        utils.prependEntry('./test.js', () => ({
            a: './app/entry-a',
            b: ['./app/entry-b1', './app/entry-b2'],
        }))().then((result) => {
            expect(result).to.eql({
                a: ['./test.js', './app/entry-a'],
                b: ['./test.js', './app/entry-b1', './app/entry-b2'],
            });
            done();
        });
    });
});
