// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

'use strict';

const path = require('path');
const fs = require('fs');
const python_shell = require('python-shell');
const portscanner = require('portscanner');
const rmdir = require('rimraf');
const url = require('url');
const command_exists_sync = require('command-exists').sync;
const is_dev = require('electron-is-dev');

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
        self.python_path = 'python';
        self.ocean_data_qc_path = '';
    },

    /**
     * Launches bokeh server application.
     * Checks if the developer mode is enabled before.
     */
    launch_bokeh: function() {
        var self = this;
        lg.info('-- LAUNCHING BOKEH');
        self.set_python_path();
    },

    get_python_version: function() {
        var self = this;
        return new Promise((resolve, reject) => {
            if (command_exists_sync('python')) {
                var py_options = {
                    mode: 'text',
                    pythonPath: 'python',
                    scriptPath: loc.scripts
                };
                python_shell.run('get_python_version.py', py_options, function (err, results) {
                    if (err) {
                        reject('>> Error running script: ' + err);
                    } else {
                        if (typeof(results) !== 'undefined') {
                            try {
                                var v = parseInt(results[0].split('.')[0])
                            } catch(err) {
                                reject('Version could not be parsed');
                            }
                            lg.warn('>> PYTHON VERSION: ' + v);
                            if (v == 3) {
                                self.python_path = 'python';  // TODO: check python3 alias???
                                resolve(true)
                            } else {
                                reject('Wrong python version');
                            }
                        }
                    }
                });
            }
        });
    },

    set_python_path: function() {
        lg.info('-- SET PYTHON PATH');
        var self = this;
        self.get_python_version().then(() => {
            self.set_ocean_data_qc_path();
        }).catch((err) => {                         // look for python manually
            lg.error(err)

            if (process.platform === 'win32' && fs.existsSync(loc.python_win)) {
                self.python_path = loc.python_win;
            } else if (process.platform === 'darwin' && fs.existsSync(loc.python_mac)) {
                self.python_path = loc.python_mac;
            } else if (process.platform === 'linux' && fs.existsSync(loc.python_lin)) {
                self.python_path = loc.python_lin;
            }
            if (self.python_path != 'python') {    // it was set manually with one of the previous paths
                                                   // if there is environment we assume that python has the correct version
                self.set_ocean_data_qc_path()
            }
        })
        lg.info('>> PYTHON PATH USED: ' + self.python_path);
    },

    set_ocean_data_qc_path: function() {
        lg.info('-- SET OCEAN DATA QC PATH');
        var self = this;

        // if (is_dev) {   // TODO: check where ocean_data_qc is installed in a better way?
        //     lg.warn('>> BEFORE SELF.OCEAN_DATA_QC_PATH: ' + self.ocean_data_qc_path);
        //     if (!fs.existsSync(self.ocean_data_qc_path)) {      // then set the development path
        //         self.ocean_data_qc_path = path.join(loc.ocean_data_qc_js, '../ocean_data_qc');
        //         lg.warn('>> AFTER SELF.OCEAN_DATA_QC_PATH: ' + self.ocean_data_qc_path);
        //     }
        //     self.set_python_shell_options();
        //     self.run_bokeh();
        // } else {

        var py_options = {
            mode: 'text',
            pythonPath: self.python_path,
            scriptPath: loc.scripts
        };
        self.shell = python_shell.run('get_module_path.py', py_options, function (err, results) {
            if (err) {
                lg.error('Error running get_module_path.py: ' + err);
            }
            if (typeof(results) !== 'undefined') {
                self.ocean_data_qc_path = results[0];    // what is the returned value if it is not found?
                self.ocean_data_qc_path = self.ocean_data_qc_path.replace(/[\n\r]+/g, '');
                self.ocean_data_qc_path = self.ocean_data_qc_path.replace(/\\/g, '\\\\');
                self.set_python_shell_options();
                self.run_bokeh();
            } else {
                lg.error('>> The script get_module_path.py did not return the correct path')
            }
        });

        // }
    },

    set_python_shell_options: function() {
        lg.info('-- GET PYTHON SHELL OPTIONS')
        var self = this;
        var dev_mode = data.get('dev_mode', loc.shared_data);
        var user_options = [
            '-m', 'bokeh', 'serve',
            '--port', self.bokeh_port
        ]
        var dev_options = [
            '--log-format', '"%(asctime)s %(levelname)s %(message)s"',       // not working??
            '--log-file', loc.log_python
        ]

        var aux_options = '';
        if (dev_mode) {
            aux_options = user_options.concat(dev_options);
        } else {
            aux_options = user_options;
        }
        self.python_options = {
            mode: 'text',               // the python script should return text
                                        // but I do not need to return anything,
                                        // so I do not mind with mode is used here
            pythonPath: self.python_path,
            pythonOptions: aux_options,
        };
    },

    /**
     * Runs bokeh server application.
     * The bokeh process is bound to the node process.
     */
    run_bokeh: function() {
        lg.warn('-- RUN BOKEH')
        var self = this;
        lg.warn('>> OCEAN DATA QC PATH: ' + self.ocean_data_qc_path);
        var _check_path_state = setInterval(function() {
            if (self.ocean_data_qc_path != '') {
                clearInterval(_check_path_state);
                process.chdir(path.join(self.ocean_data_qc_path, ''));
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
            }
        }, 100);


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