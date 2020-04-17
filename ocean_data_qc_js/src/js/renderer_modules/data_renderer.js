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
    export_whp_format_dialog: function() {
        var self = this;
        lg.info('-- SAVE EXPORT WHP')
        dialog.showSaveDialog({
            title: 'Export Project as WHP CSV file',
            defaultPath: '~/' + data.get('project_name', loc.proj_settings) + '_export_whp.csv',
            filters: [{ extensions: ['csv'] }]
        }).then((results) => {
            if (results['canceled'] == false) {
                self.export_whp_format(results);
            }
        });

    },

    export_whp_format: function (results) {
        var fileLocation = results['filePath'];
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
    },

    export_csv_format_dialog: function() {
        lg.info('-- EXPORT CSV DATA');
        var self = this;
        dialog.showSaveDialog({
            title: 'Export Project as CSV file',
            defaultPath: '~/' + data.get('project_name', loc.proj_settings) + '_export_data.csv',
            filters: [{ extensions: ['csv'] }]
        }).then((results) => {
            if (results['canceled'] == false) {
                self.export_csv_format(results);
            }
        });
    },

    export_csv_format: function (results) {
        var fileLocation = results['filePath'];
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
    },

    export_excel_format_dialog: function(format='xlsx') {
        lg.info('-- EXPORT EXCEL FORMAT DIALOG');
        var self = this;
        dialog.showSaveDialog({
            title: 'Export Project as xlsx file',
            defaultPath: '~/' + data.get('project_name', loc.proj_settings) + '_export_data.' + format,
            filters: [{ extensions: [format] }]
        }).then((results) => {
            if (results['canceled'] == false) {
                self.export_excel_format(results, format);
            }
        });
    },

    export_excel_format: function (results, format='xlsx') {
        var fileLocation = results['filePath'];
        lg.info('Saving plain xlsx data file at: ' + fileLocation);
        if (typeof(fileLocation) !== 'undefined') {
            try {
                var xlsx_path = path.join(loc.proj_files, 'export_data.' + format);
                lg.warn('>> XLSX PATH: ' + xlsx_path);
                var read = fs.createReadStream(xlsx_path);
                read.on("error", function(err) {
                    tools.showModal('ERROR', 'The file could not be read!', 'ERROR', false, err)
                });
                var write = fs.createWriteStream(fileLocation);
                write.on("error", function(err) {
                    tools.showModal('ERROR', 'The file could not be exported!', 'ERROR', false, err);
                });
                write.on("close", function(ex) {
                    fs.unlink(xlsx_path, (err) => {
                        if (err) {
                            tools.showModal('ERROR', 'The file could not be removed from the TMP folder!', 'ERROR', false, err);
                        } else {
                            fs.unlink(path.join(loc.proj_files, 'export_data.csv'), (err) => {
                                if (err) {
                                    tools.showModal('ERROR', 'The file could not be removed from the TMP folder!', 'ERROR', false, err);
                                } else {
                                    tools.show_snackbar('File exported!');
                                }
                            });
                        }
                    });
                });
                read.pipe(write);

            } catch(err) {
                tools.showModal('ERROR', 'The file could not be saved!', 'ERROR', false, err);
            }
        }
    },

    download_custom_json_template: function() {
        lg.info('-- DOWNLOAD CUSTOM SETTINGS JSON TEMPLATE');
        var self = this;
        var datetime = new Date();
        dialog.showSaveDialog({
            title: 'Export Project as WHP CSV file',
            defaultPath: '~/custom_settings_' + datetime.toISOString().slice(0,10) + '.json',
            filters: [{ extensions: ['json'] }]
        }).then((results) => {
            if (results['canceled'] == false) {
                var file_path = results['filePath'];
                lg.warn('>> FILE DOWNLOADED IN: ' + file_path);
                var a = fs.createReadStream(loc.custom_settings);
                var c = fs.createWriteStream(file_path);

                a.on('error', (err) => {
                    tools.showModal('ERROR', 'The file you have opened could not be read');
                });
                c.on('error', (err) => {
                    tools.showModal('ERROR', 'Some error writing to the file');
                });
                var p = a.pipe(c);

                p.on('close', function(){
                    tools.show_modal({
                        'type': 'INFO',
                        'msg': 'Custom Settings downloaded in: ' + file_path
                    });
                });
            }
        });

    },

    upload_custom_json_template: function() {
        lg.info('-- UPLOAD CUSTOM SETTINGS JSON TEMPLATE')
        var self = this;
        dialog.showOpenDialog({
            title: 'Open the AQC Settings file...',
            filters: [{ name: 'AtlantOS Ocean Data QC Settings file', extensions: ['json'] }],
            properties: ['openFile'],
        }).then(result => {
            lg.info(result);
            if (result['canceled'] == false) {
                var file_path = result['filePaths'][0];
                fs.readFile(file_path, (err, data) => {
                    if (err) throw err;
                    try {
                        JSON.parse(data);
                    } catch(err) {
                        tools.show_modal({
                            'type': 'VALIDATION ERROR',
                            'msg': 'JSON file could not be parsed. '
                                   + 'Check if the syntax is right and try to upload it again'
                        });
                        return;  // is this working OK?
                    }

                    var a = fs.createReadStream(file_path);
                    var c = fs.createWriteStream(loc.custom_settings);

                    a.on('error', (err) => {
                        tools.showModal('ERROR', 'The file you have opened could not be read');
                    });
                    c.on('error', (err) => {
                        tools.showModal('ERROR', 'Some error writing to the file');
                    });
                    var p = a.pipe(c);

                    p.on('close', function(){
                        self.ipc_renderer.send('check-json-custom-settings');
                        tools.show_modal({
                            'type': 'INFO',
                            'msg': 'Custom Settings correctly updated.'
                        });
                    });
                });
            }
        });
    },
}