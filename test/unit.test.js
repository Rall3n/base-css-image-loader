const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const utils = require('../src/utils');

describe('Unit Test: utils', () => {
    const file = fs.readFileSync(path.resolve(__dirname, './fixtures/files/index.css'));
    it('.genMD5(stream)', () => {
        const hash = utils.genMD5(file);
        expect(hash).to.equal('c3639561deadee9c232f48c37a558b8b');
    });

    it('.urlResolve(base, urlPath)', () => {
        const cases = [
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
        cases.forEach((_case) => {
            const result = utils.urlResolve(_case[0], _case[1]);
            expect(result).to.equal(_case[2]);
        });
    });

    it('.createFileName(placeholder, data)', () => {
        const cases = [
            ['[fileName].[ext]?[hash]', { fileName: 'demo', ext: 'css', content: file }, 'demo.css?c3639561deadee9c232f48c37a558b8b'],
            ['[fileName]_[hash:16].[ext]', { fileName: 'demo', ext: 'css', content: file }, 'demo_c3639561deadee9c.css'],
            ['[fileName].[hash:base64:8].[ext]', { fileName: 'demo', ext: 'css', content: file }, 'demo.2byRlWMQ.css'],
        ];
        cases.forEach((_case) => {
            const result = utils.createFileName(_case[0], _case[1]);
            expect(result).to.equal(_case[2]);
        });
    });

    it('.prependToEntry(filePaths, entry)', (done) => {
        const cases = [
            [
                './test.js',
                './app/entry',
                ['./test.js', './app/entry'],
            ],
            [
                ['./test.js'],
                './app/entry',
                ['./test.js', './app/entry'],
            ],
            [
                ['./test-2.js', './test.js'],
                './app/entry',
                ['./test-2.js', './test.js', './app/entry'],
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

        cases.forEach((_case) => {
            const result = utils.prependToEntry(_case[0], _case[1]);
            expect(result).to.eql(_case[2]);
        });

        utils.prependToEntry('./test.js', () => ({
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

    it('.appendToEntry(filePaths, entry)', (done) => {
        const cases = [
            [
                './test.js',
                './app/entry',
                ['./app/entry', './test.js'],
            ],
            [
                ['./test.js'],
                './app/entry',
                ['./app/entry', './test.js'],
            ],
            [
                ['./test-2.js', './test.js'],
                './app/entry',
                ['./app/entry', './test-2.js', './test.js'],
            ],
            [
                './test.js',
                ['./app/entry'],
                ['./app/entry', './test.js'],
            ],
            [
                './test.js',
                {
                    a: './app/entry-a',
                    b: ['./app/entry-b1', './app/entry-b2'],
                },
                {
                    a: ['./app/entry-a', './test.js'],
                    b: ['./app/entry-b1', './app/entry-b2', './test.js'],
                },
            ],
        ];

        cases.forEach((_case) => {
            const result = utils.appendToEntry(_case[0], _case[1]);
            expect(result).to.eql(_case[2]);
        });

        utils.appendToEntry('./test.js', () => ({
            a: './app/entry-a',
            b: ['./app/entry-b1', './app/entry-b2'],
        }))().then((result) => {
            expect(result).to.eql({
                a: ['./app/entry-a', './test.js'],
                b: ['./app/entry-b1', './app/entry-b2', './test.js'],
            });
            done();
        });
    });

    it('.escape(string)', () => {
        expect(utils.escape(`slash\\and"quote'`)).to.equal(`slash\\\\and\\"quote\\'`);
    });
});
