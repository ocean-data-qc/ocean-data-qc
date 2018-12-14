////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const fs = require('fs');
const file_url = require('file-url');     // converts file path to file:// protocol,
                                          // use fileToPath() function for the opposite
const {dialog} = require('electron');
const db = require('mime-db');
const mime = require('mime-type')(db);
const { URL } = require('url');           // constructor > fs recognise the file:// url built with this
const zip = require('cross-zip');         // it does not work on Windows 7 by default
const rmdir = require('rimraf')

const loc = require('locations');
const lg = require('logging');
const data = require('data');


module.exports = {
    init: function(web_contents, server) {
        var self = this;
        self.web_contents = web_contents;
        self.server = server;
    },

    show_moves: function() {
        var self = this;
        self.web_contents.send('show-moves');
    },

    update_from_csv: function() {
        var self = this;
        lg.info('-- UPDATE FROM CSV')
        dialog.showOpenDialog({
            title: 'Open the AQC file...',
            filters: [{ name: 'AtlantOS Ocean Data QC file', extensions: ['csv'] }],
            properties: ['openFile'],
        }, function (file_paths) {
                self.web_contents.send('show-wait-cursor');
                if (file_paths === undefined) {
                    self.web_contents.send('show-default-cursor');
                    return;
                }
                var file_path = file_paths[0];
                if (mime.lookup(file_path) == 'text/csv') {
                    lg.info('Importing the CSV file name to the temporal folder...');
                    try {
                        data.copy(file_path, path.join(loc.proj_files, 'new.csv'), function() {
                            lg.info('main.js - the new.csv file was created...')
                            self.web_contents.send('compare-data');
                        });
                    } catch(err) {
                        self.web_contents.send('show-default-cursor');
                        self.web_contents.send('show-modal', {
                            'type': 'ERROR',
                            'msg': 'Something went wrong importing the new CSV file'
                        });
                    }
                }else{
                    // Actually it is impossible to get to here, because is out of domain ['csv']
                    self.web_contents.send('show-default-cursor');
                    self.web_contents.send('show-modal', {
                        'type': 'ERROR',
                        'msg': 'Wrong filetype!! It must be an CSV file.'
                    });
                }
            }
        );
    },

    open_dialog: function() {
        var self = this;
        dialog.showOpenDialog({
                title: 'Open the AQC file...',
                filters: [{ name: 'AtlantOS Ocean Data QC file', extensions: ['aqc', 'csv'] }],
                properties: ['openFile'],
            }, function(file_paths) { self.open_file(file_paths); }
        );
    },

    open_file: function (file_paths) {
        lg.info('-- OPEN FILE');
        var self = this;
        self.web_contents.send('show-wait-cursor');
        if (file_paths === undefined) return;
        var file_path = file_paths[0];

        mime.define(                        // adding new extension to node mime-types
            'application/aqc', {
                source: 'atlantos',
                compressible: false,
                extensions: ['aqc' ]
            }, mime.dupAppend
        );

        if(mime.lookup(file_path) == 'application/aqc') {
            //var outPath = path.join(__dirname, '../tmp')    // It will extract the content to the "files" folder
            var outPath = path.join(loc.proj_files,'..');
            if (process.platform === 'win32') { // check if it is only in windows
                outPath = loc.proj_files;
                if (!fs.existsSync(loc.proj_files)) {
                    fs.mkdirSync(loc.proj_files);
                }
            }
            lg.info('>> outPath: ' + outPath);
            try {
                zip.unzipSync(file_path, outPath)         // dangerous if the content is other, how to check it?
                var project_file = file_url(file_path)
                data.set({'project_state': 'saved'}, loc.shared_data);
                data.set({'project_file': project_file, }, loc.proj_settings);
                self.web_contents.send('enable-watcher', {'mark': 'saved'});
            } catch(err) {                               // we must trust the user
                self.web_contents.send('show-modal', {
                    'type': 'ERROR',
                    'msg': 'The file could not be opened!<br />Make sure that is a correct AQC file'+err
                });
                return false;
            }
            self.web_contents.send('go-to-bokeh');
        }else if (mime.lookup(file_path) == 'text/csv') {  // how to check if it is a CSV file??
            data.set({'project_state': 'modified'}, loc.shared_data);
            self.web_contents.send('project-settings-user', {
                'csv_file': file_path
            });
        }else{
            self.web_contents.send('show-modal', {   // it is impossible to get to here, because is out of domain ['csv', 'aqc']
                'type': 'ERROR',
                'msg': 'Wrong filetype!!<br />It must be an AQC or a CSV file'
            });
        }
    },

    file_to_path: function(fileUrl=false) {
        var self = this;
        // Convert a url "file:///C/..." to a path "C:/..."
        var path = new URL(fileUrl).pathname;
        if (process.platform === 'win32') {
            if(path.charAt(0) === '/') {  // TODO: check if this is necessary on linux and mac
                path = path.substr(1);
            }
        }
        return path;
    },

    save_file: function() {
        var self = this;
        return new Promise((resolve, reject) => {
            var project_file = data.get('project_file', loc.proj_settings);
            var file_path = false;
            if (project_file != false) {
                file_path = self.file_to_path(project_file);
            }
            lg.info('>> URL PROJECT FILE: ' + file_path);
            if (file_path != false && fs.existsSync(file_path)) {
                try {
                    zip.zipSync(loc.proj_files, file_path);
                    self.web_contents.send('enable-watcher', { 'mark': 'saved' });
                    self.web_contents.send('show-snackbar', {'msg': 'The project was correctly saved.'})
                } catch(err) {
                    self.web_contents.send('show-modal', {
                        'type': 'ERROR',
                        'msg': 'The file could not be saved!'
                    });
                }
                resolve(true);
            } else {
                self.save_file_as();
            }
        });
    },

    save_file_as: function() {
        var self = this;
        return new Promise((resolve, reject) => {
            lg.info('-- SAVE FILE AS');
            var settings = data.load(loc.proj_settings);  // use settings only to read
            dialog.showSaveDialog({
                    title: 'Save Project',
                    defaultPath: '~/examples/' + settings.project_name + '.aqc',    // TODO >> previuos opened folder?? https://github.com/electron/electron/issues/1541
                    filters: [{ extensions: ['aqc'] }]
                }, function (fileLocation) {
                    lg.info('Saving project at: ' + fileLocation);
                    if (typeof(fileLocation) !== 'undefined') {
                        try {
                            zip.zipSync(loc.proj_files, fileLocation);
                            fileLocation = file_url(fileLocation);
                            self.web_contents.send('disable-watcher');  // I do not why, but this is necessary
                            data.write_promise({'project_file': fileLocation }).then((value) => {
                                // https://blog.risingstack.com/mastering-async-await-in-nodejs/
                                if (value == true) {  // if everything was OK >> di this with reject and catch(err)...
                                    self.web_contents.send('enable-watcher', {'mark': 'saved'});
                                    self.web_contents.send('show-snackbar', {
                                        'msg': 'The project was saved correctly'
                                    });
                                }
                            });
                        } catch(err) {
                            self.web_contents.send('show-modal', {
                                'type': 'ERROR',
                                'msg': 'The file could not be saved!<br />' + err
                            });
                            reject(new Error('fail'));
                        }
                    }
                    resolve(true);
                }
            );
        });
    },

    save_file_as_caught: function() {
        var self = this;
        self.save_file_as(self).then(function () {
             return true;
        }).catch(function (e) {
             lg.warn('Save file as Promise Rejected: ' + e);
             return false;
        });
    },

    export_moves: function() {
        var self = this;
        lg.info('-- EXPORT MOVES --');
        var project_name = data.get('project_name', loc.proj_settings);
        var moves_name = '';
        if (project_name == false) {
            moves_name = 'moves.csv';
        } else {
            moves_name = project_name + '_moves.csv';
        }
        dialog.showSaveDialog({
                title: 'Save Project',
                defaultPath: '~/' + moves_name,
                filters: [{ extensions: ['csv'] }]
            }, function (fileLocation) {
                if (typeof(fileLocation) !== 'undefined') {
                    lg.info('>> No debe entrar por aquí ??');
                    var moves_path = path.join(loc.proj_files, 'moves.csv')

                    var read = fs.createReadStream(moves_path);
                    read.on("error", function(err) {
                        self.web_contents.send('show-modal', {
                            'type': 'ERROR',
                            'msg': 'The file could not be saved!'
                        });
                    });

                    var write = fs.createWriteStream(fileLocation);
                    write.on("error", function(err) {
                        self.web_contents.send('show-modal', {
                            'type': 'ERROR',
                            'msg': 'The file could not be saved!'
                        });
                    });
                    write.on("close", function(ex) {
                        self.web_contents.send('show-snackbar', {'msg': 'File saved!'});
                    });
                    read.pipe(write);
                }
            }
        );
    },

    edit_project_json: function() {
        var self = this;
        lg.info('-- EDIT PROJECT SETTINGS (JSON)');
        self.web_contents.send('set-project-settings-json');
    },

    edit_project: function() {
        var self = this;
        lg.info('-- EDIT PROJECT SETTINGS USER');
        self.web_contents.send('project-settings-bokeh');
    },

    close_project: function() {
        var self = this;
        lg.info('-- CLOSE PROJECT');
        var project_state = data.get('project_state', loc.shared_data);
        if(project_state == 'modified'){
            self.web_contents.send('show-modal-close-project-form', {
                'title': 'Changes not saved!',
                'msg': 'Would you like to save the project changes before closing the project?'
            });
        }else{
            self.web_contents.send('disable-watcher');
            rmdir(loc.proj_files, function(err) {
                if (err) {
                    self.web_contents.send('show-modal', {
                        'type': 'ERROR',
                        'msg': 'The file could not be saved:<br />' + err
                    });
                    return false;
                }
                self.web_contents.send('reset-bokeh');
            });
        }
    }
};