////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

'use strict';

const path = require('path');
const fs = require('fs');
const python_shell = require('python-shell');
const portscanner = require('portscanner');
const rmdir = require('rimraf');
const url = require('url');

const {dialog} = require('electron');
const {app} = require('electron');

const loc = require('locations');
const lg = require('logging');
const data = require('data');

module.exports = {
    init: function(web_contents, menu) {
        var self = this;
        self.web_contents = web_contents;
        self.menu = menu;
        self.bokeh_port = data.get('bokeh_port', loc.shared_data);
        self.shell = null;
        self.python_options = {};
    },

    /**
     * Launches bokeh server application.
     * Checks if the developer mode is enabled before.
     */
    launch_bokeh: function() {
        var self = this;
        lg.info('-- LAUNCHING BOKEH');
        self.set_python_shell_options();
        self.run_bokeh();
    },

    set_python_shell_options: function() {
        lg.info('-- GET PYTHON SHELL OPTIONS')
        var self = this;
        var aux_options = '';

        var dev_mode = data.get('dev_mode', loc.shared_data);
        var user_options = [
            '-m', 'bokeh', 'serve',
            '--port', self.bokeh_port,
        ]
        if (process.platform === 'win32') {
            var dev_options = [
                '--log-format', '"%(asctime)s %(levelname)s %(message)s"',       // not working??
                '--log-file', loc.log_python
            ]
            if (dev_mode) {
                aux_options = user_options.concat(dev_options);
            } else {
                aux_options = user_options;
            }

            self.python_options = {
                mode: 'text',               // the python script should return text
                                            // but I do not need to return anything,
                                            // so I do not mind with mode is used here
                pythonPath: loc.python_win,
                pythonOptions: aux_options,
            };
        } else if (process.platform == 'linux') {
            var dev_options = [
                '--log-format', '"%(asctime)s %(levelname)s %(message)s"',       // not working??
                '--log-file', loc.log_python
            ]
            if (dev_mode) {
                aux_options = user_options.concat(dev_options);
            } else {
                aux_options = user_options;
            }

            self.python_options = {
                mode: 'text',
                pythonPath: loc.spawn_python_lin,
                pythonOptions: aux_options,
            };
        } else if (process.platform == 'darwin') {
            var dev_options = [
                '--log-format', '"%(asctime)s %(levelname)s %(message)s"',       // not working??
                '--log-file', loc.log_python
            ]
            if (dev_mode) {
                aux_options = user_options.concat(dev_options);
            } else {
                aux_options = user_options;
            }

            self.python_options = {
                mode: 'text',
                pythonPath: loc.spawn_python_mac,
                pythonOptions: aux_options,
            };
        } else {
            lg.error('NON SUPPORTED OS');
        }
    },

    /**
     * Runs bokeh server application.
     * The bokeh process is bound to the node process.
     */
    run_bokeh: function() {
        var self = this;
        var aux_folder = process.cwd();
        process.chdir(loc.ocean_data_qc_win);

        // TODO: check if this works on Mac and Windows
        // lg.info('>> SELF.PYTHON OPTIONS: ' + JSON.stringify(self.python_options, null, 4));
        self.shell = python_shell.run('', self.python_options, function (err, results) {
            lg.info('>> BOKEH RETURNS ANYTHING TO PYTHON SHELL');
            if (err) {
                lg.error(`>> ERROR RUNNING BOKEH: ${err}`);
            }
            // results is an array consisting of messages collected during execution
            if (typeof(results) !== 'undefined') {
                lg.info('>> OCEAN_DATA_QC RETURNS: ' + results[0]);
            } else {
                self.web_contents.send('show-modal', {
                    'type': 'ERROR',
                    'msg': 'Something was wrong intializing bokeh server' + err
                });
            }
        });
        process.chdir(aux_folder);
    },

    /**
     * Kills the bokeh process and launches it again
     */
    relaunch_bokeh: function() {
        lg.info('-- RELAUNCH BOKEH');
        var self = this;
        self.web_contents.send('show-loader');
        self.shell.childProcess.kill();
        self.launch_bokeh();
        self.load_bokeh_on_iframe();
        self.web_contents.send('relaunch-bokeh');
    },

    load_bokeh_on_iframe: function() {
        var self = this;
        var bokeh_port = data.get('bokeh_port', loc.shared_data);
        var ensure_one = false;
        var _checkBokehPort = setInterval(function() {
            portscanner.checkPortStatus(bokeh_port, function(error, status) {
                if (status == 'open') {
                    clearInterval(_checkBokehPort);
                    if (ensure_one == false) {
                        ensure_one = true;
                        lg.info('-- BOKEH PORT OPEN, SENDING SIGNAL TO LOAD THE IFRAME');

                        self.web_contents.send('load-bokeh-on-iframe')
                    }
                }
                if (error) {
                    self.web_contents.send('show-modal', {
                        'type': 'ERROR',
                        'msg': 'Bokeh could not be loaded on the iframe: <br />' + error
                    });
                }
            });
        }, 100);
    },

    /**
     * Loads the main menu and the main window
     * This is useful if the app is loaded for the first time
     */
    go_to_welcome_window: function() {
        var self = this;
        self.menu.set_main_menu();
        self.web_contents.loadURL(url.format({
            pathname: path.join(loc.html, 'main.html'),
            protocol: 'file:',
            slashes: true
        }));
    },

    close_app: function() {
        lg.info('-- CLOSE APP')
        if (process.platform !== 'darwin') {
            app.quit();  // this waits until the children (self.shell.childProcess) are killed
        }
    },

    close_with_exit_prompt: function(e) {
        var self = this;
        lg.info('-- CLOSE APP DIALOG');
        if (fs.existsSync(loc.proj_files)) {
            if (app.showExitPrompt) {
                if (typeof(e) !== 'undefined' && typeof(e.preventDefault) !== 'undefined') {
                    e.preventDefault();
                }
                dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No' ],
                    title: 'Confirm',
                    message: 'Unsaved data will be lost. Are you sure you want to quit?'
                }, function (response) {
                    if (response === 0) { // The following is run if 'Yes' is clicked
                        rmdir(loc.proj_files, function(err) {
                            if (err) {
                                webContents.send('show-modal', {
                                    'type': 'ERROR',
                                    'msg': 'The project could not be discarded:<br />' + err
                                });
                            } else {
                                app.showExitPrompt = false
                                self.close_app();
                            }
                        });
                    }
                })
            }
        } else {
            self.close_app();
        }
    },
}