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
const { spawn } = require('child_process');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('../renderer_modules/tools');

module.exports = {
    init: function(web_contents, menu) {
        var self = this;
        self.web_contents = web_contents;
        self.menu = menu;
        self.bokeh_port = data.get('bokeh_port', loc.shared_data);
        self.shell = null;
        self.ts_shell = null;
        self.python_options = {};
        self.script_env_path = ''
        self.python_path = 'python';
        self.ocean_data_qc_path = '';
        self.octave_path = data.get('octave_path', loc.shared_data);
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

    check_python_version: function() {
        var self = this;
        return new Promise((resolve, reject) => {
            var py_options = {
                mode: 'text',
                pythonPath: self.python_path,
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
                        if (v == 3) {
                            resolve(true)
                        } else {
                            reject('Wrong python version: ' + results[0]);
                        }
                    }
                }
            });
        });
    },

    /** Sets the python path
     *    1. First check if python exists in the environment
     *    2. If not it will use the local python instaled in the system
     *  Sets scripts python path as well
    */
    set_python_path: function() {
        var self = this;
        lg.info('-- SET PYTHON PATH')
        if (process.platform === 'win32' && fs.existsSync(loc.python_win)) {
            self.python_path = loc.python_win;
            self.script_env_path = loc.env_bin_win;
        } else if (process.platform === 'darwin' && fs.existsSync(loc.python_mac)) {
            self.python_path = loc.python_mac;
            self.script_env_path = loc.env_bin_mac;
        } else if (process.platform === 'linux' && fs.existsSync(loc.python_lin)) {
            self.python_path = loc.python_lin;
            self.script_env_path = loc.env_bin_lin;
        } else {
            self.python_path = 'python';
        }
        lg.info('>> (SET_PYTHON_PATH) SELF.PYTHON_PATH: ' + self.python_path)
        self.check_python_version().then(() => {
            self.set_ocean_data_qc_path();
        }).catch((err) => {
            lg.warn('>> WRONG PYTHON PATH: ' + self.python_path);
            lg.warn('>> ERR: ' + err);
            if (command_exists_sync('python')) {
                self.python_path = 'python'
                self.check_python_version().then(() => {
                    self.set_ocean_data_qc_path();
                }).catch((err) => {
                    lg.warn('>> WRONG PYTHON PATH USED: ' + self.python_path);
                    lg.warn('>> ERR: ' + err);
                })
            } else {
                if (command_exists_sync('python3')) {
                    self.python_path = 'python3'
                    self.check_python_version().then(() => {
                        self.set_ocean_data_qc_path();
                    }).catch((err) => {
                        lg.warn('>> WRONG PYTHON PATH USED: ' + self.python_path);
                        lg.warn('>> ERR: ' + err);
                    })
                }
            }
        })
    },

    set_ocean_data_qc_path: function() {
        var self = this;
        var py_options = {
            mode: 'text',
            pythonPath: self.python_path,
            scriptPath: loc.scripts
        };
        self.shell = python_shell.run('get_module_path.py', py_options, function (err, results) {
            if (err || typeof(results) == 'undefined') {  // The script get_module_path.py did not return the correct path
                lg.error(
                    'Error running get_module_path.py. ' +
                    'Make sure you have installed the ocean_data_package: ' + err
                );

                // NOTE: If an ImportError (or any other error) is got >>
                //       ocean_data_module is posibly not installed.
                //       Then look for the sibling folder of ocean_data_qc_js
                //       to make this work the environment should exists
                //       its dependencies should be installed as well

                if (fs.existsSync(loc.ocean_data_qc_dev)) {
                    self.ocean_data_qc_path = loc.ocean_data_qc_dev;
                    self.set_python_shell_options();
                    self.run_bokeh();
                }
            }
            if (typeof(results) !== 'undefined') {
                // TODO: what is the returned value if it is not found without any error?

                var p = results[0].replace(/[\n\r]+/g, '');
                self.ocean_data_qc_path = tools.file_to_path(p);
                self.set_python_shell_options();
                self.run_bokeh();
            }
        });
    },

    set_python_shell_options: function() {
        lg.info('-- SET PYTHON SHELL OPTIONS')
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
        var aux_options = user_options;
        if (dev_mode) {
            aux_options = user_options.concat(dev_options);
        }
        self.python_options = {
            mode: 'text',               // actually I do not need to return anything,
            pythonPath: self.python_path,
            pythonOptions: aux_options,
            scriptPath: self.ocean_data_qc_path
        };
    },

    /**
     * Runs bokeh server application.
     * The bokeh process is bound to the node process.
     */
    run_bokeh: function() {
        var self = this;
        lg.info('-- RUN BOKEH')
        // lg.warn('>> PYTHON SHELL OPTIONS: ' + JSON.stringify(self.python_options, null, 4));
        if (self.ocean_data_qc_path != '') {
            self.shell = python_shell.run(
                '', self.python_options, (err, results) => {
                    if (err || typeof(results) == 'undefined') {
                        lg.error(`>> ERROR RUNNING BOKEH: ${err}`);
                    }
                    if (typeof(results) !== 'undefined') {  // actually nothing is returned
                        if (results != null) {
                            lg.info('>> OCEAN_DATA_QC RETURNS: ' + results[0]);
                        } else {
                            lg.error('>> PYTHON SHELL COMMAND RETURNED NULL')
                        }
                    }
                }
            );
        }
    },

    /**
     * Kills the bokeh process and launches it again
     */
    relaunch_bokeh: function() {
        lg.info('-- RELAUNCH BOKEH');
        var self = this;
        self.web_contents.send('show-loader');
        self.shell.childProcess.kill();
        if (self.ts_shell != null) {
            self.ts_shell.childProcess.kill();
        }
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

    close_app: function () {
        var self = this;
        lg.info('-- CLOSE APP')
        self.shell.childProcess.kill();  // mac needs to kill children explicitly
        if (self.ts_shell != null) {
            self.ts_shell.childProcess.kill();
        }
        app.quit();  // this waits until the children (self.shell.childProcess) are killed
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

    /* Check if the command Octave exists in the PATH environment variable
    * If it does not exist, then Octave cannot be used
    */
    set_octave_path: function() {
        var self = this;
        if (self.octave_path == false || (self.octave_path != false && !fs.existsSync(tools.file_to_path(self.octave_path)))) {
            lg.info('-- SET OCTAVE PATH');
            var py_options = {
                mode: 'text',
                pythonPath: self.python_path,
                scriptPath: loc.scripts
            };
            python_shell.run('get_octave_path.py', py_options, function (err, results) {
                if (err || typeof(results) === 'undefined') {
                    lg.warn('>>Error detecting Octave executable: ' + err.message);
                    data.set({'octave_path': false }, loc.shared_data);
                    data.set({'octave_version': false }, loc.shared_data);
                    self.web_contents.send(
                        'set-octave-info',
                        {'msg': 'Undetected in PATH' }
                    );
                } else {
                    try {
                        self.octave_path = results[0];
                        data.set({'octave_path': self.octave_path }, loc.shared_data);
                        self.set_octave_version()
                    } catch (err) {
                        lg.warn('>> OCTAVE ERROR CHECKING VERSION: ' + err)
                        data.set({'octave_path': false }, loc.shared_data);
                        data.set({'octave_version': false }, loc.shared_data);
                        self.web_contents.send(
                            'set-octave-info',
                            {'msg': 'Error checking version' }
                        );
                    }
                }
            })
        } else {
            lg.info('>> octave set on: ' + self.octave_path);
            self.set_octave_version()
            //self.web_contents.send('set-octave-info');
        }
    },

    set_octave_version() {
        var self = this;
        var full_str_version = '';
        const octave = spawn(
            tools.file_to_path(self.octave_path),      // command >> is this working on mac an linux?
            ['--eval', '"OCTAVE_VERSION"'],     // args
            {'shell': true }                    // options
        );
        octave.stdout.on('data', (buffer) => {
            var version = buffer.toString('utf8');
            full_str_version += version;
            if (full_str_version.match(/ans = [0-9]\.[0-9]\.[0-9]/g) != null) {
                // NOTE: When the expression is full (all buffers concatenated)
                //       Expected answer: "ans = 4.1.4"
                full_str_version = full_str_version.split('=')[1].trim();
                data.set({'octave_version': full_str_version}, loc.shared_data);
                self.web_contents.send('set-octave-info');
            }
        });
        octave.stderr.on('data', (data) => {
            lg.warn(`Error detecting Octave version: ${data}`);
        });
    },

    /**
     * Runs tile server application.
     */
    run_tile_server: function() {
        var self = this;
        lg.info('-- RUN TILE SERVER');
        if (self.ts_shell != null) {
            lg.warn('>> TILE SERVER ALREADY RUNNING');
            return;
        }
        var _checkScriptEnvPathSet = setInterval(function() {
            if (self.script_env_path != '') {
                clearInterval(_checkScriptEnvPathSet);
                var py_options = {
                    mode: 'text',                            // actually I do not need to return anything,
                    pythonPath: self.python_path,
                    args: [loc.basemap_offile_tile],
                    scriptPath: self.script_env_path
                };
                lg.info('>> TILE SERVER OFFLINE FILE: ' + path.parse(loc.basemap_offile_tile).base);
                if (self.ocean_data_qc_path != '') {
                    self.ts_shell = python_shell.run(
                        'tc-viewer', py_options, (err, results) => {
                            if (err || typeof(results) !== 'undefined') {
                                lg.error(`>> ERROR RUNNING TILE SERVER: ${err}`);
                            }
                            if (typeof(results) !== 'undefined') {  // actually nothing is returned? >> divert info
                                lg.info('>> TILE SERVER RETURNS: ' + results[0]);
                            }
                        }
                    );
                }
            }
        }, 100);

    },
}