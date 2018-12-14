////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

"use strict";

const loc = require('locations');
const winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            formatter: function(options) {
                var date = new Date();
                var str_date = date.toISOString().replace(/T|Z/g, ' ')
                return str_date + 'NODE - ' + options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
            },
            json: false,            // because there is an unfixable bug: https://github.com/winstonjs/winston/issues/545
            filename: loc.log_js,
        })
    ]
});

module.exports = logger


