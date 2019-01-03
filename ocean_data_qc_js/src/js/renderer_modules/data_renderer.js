// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const app_module_path = require('app-module-path')
app_module_path.addPath(path.join(__dirname, '../modules'));
app_module_path.addPath(path.join(__dirname, '../modals_renderer'));
app_module_path.addPath(__dirname);

const {dialog} = require('electron').remote;
const fs = require('fs');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    export_whp_format: function() {
        lg.info('-- SAVE EXPORT WHP')
        dialog.showSaveDialog({
                title: 'Export Project as WHP CSV file',
                defaultPath: '~/' + data.get('project_name', loc.proj_settings) + '_export_whp.csv',
                filters: [{ extensions: ['csv'] }]
            }, function (fileLocation) {
                lg.info('Saving WHP file at: ' + fileLocation);
                if (typeof(fileLocation) !== 'undefined') {
                    try {
                        var read = fs.createReadStream(path.join(loc.proj_files, 'export_whp.csv'));
                        read.on("error", function(err) {
                            tools.showModal('ERROR', 'The file could not be read!', 'ERROR', false, err)
                        });    
                        var write = fs.createWriteStream(fileLocation);
                        write.on("error", function(err) {
                            tools.showModal('ERROR', 'The file could not be exported!', 'ERROR', false, err);
                        });
                        write.on("close", function(ex) {
                            fs.unlinkSync(path.join(loc.proj_files, 'export_whp.csv'))
                            tools.show_snackbar('File exported!');
                        });
                        read.pipe(write);
    
                    } catch(err) {
                        tools.showModal('ERROR', 'The file could not be saved!', 'ERROR', false, err);
                    }
                }
            }
        );
    },

    export_csv_format: function() {
        var self = this;
        lg.info('-- EXPORT CSV DATA');
        dialog.showSaveDialog({
            title: 'Export Project as CSV file',
            defaultPath: '~/' + data.get('project_name', loc.proj_settings) + '_export_data.csv',
            filters: [{ extensions: ['csv'] }]
        }, function (fileLocation) {
            lg.info('Saving plain CSV data file at: ' + fileLocation);
            if (typeof(fileLocation) !== 'undefined') {
                try {
                    var read = fs.createReadStream(path.join(loc.proj_files, 'export_data.csv'));
                    read.on("error", function(err) {
                        tools.showModal('ERROR', 'The file could not be read!', 'ERROR', false, err)
                    });    
                    var write = fs.createWriteStream(fileLocation);
                    write.on("error", function(err) {
                        tools.showModal('ERROR', 'The file could not be exported!', 'ERROR', false, err);
                    });
                    write.on("close", function(ex) {
                        fs.unlinkSync(path.join(loc.proj_files, 'export_data.csv'))
                        tools.show_snackbar('File exported!');
                    });
                    read.pipe(write);

                } catch(err) {
                    tools.showModal('ERROR', 'The file could not be saved!', 'ERROR', false, err);
                }
            }
        }
    );
    },
}