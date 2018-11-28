'use strict';

let ConcatenatedModule;
try {
    ConcatenatedModule = require('webpack/lib/optimize/ConcatenatedModule');
} catch (e) { }

/* eslint-disable prefer-spread */
function getAllModules(compilation) {
    let modules = compilation.modules;
    if (compilation.children.length) {
        const childModulesList = compilation.children.map(getAllModules);
        modules = modules.concat.apply(modules, childModulesList);
    }

    if (ConcatenatedModule) {
        const concatenatedModulesList = modules.filter((m) => m instanceof ConcatenatedModule)
            .map((m) => m.modules || m._orderedConcatenationList.map((entry) => entry.module));
        if (concatenatedModulesList.length)
            modules = modules.concat.apply(modules, concatenatedModulesList);
    }

    return modules;
}

module.exports = getAllModules;
