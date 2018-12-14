////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

"use strict";

const rmdir = require('rimraf')
const chalk = require("chalk")

rmdir('dist', function (err) {
    if (err) {
        console.log(`${chalk.red("ERROR")}: the dist folder could not be removed.`)
    }
    console.log(`${chalk.yellow("WARNING")}: dist folder removed.`)
});

