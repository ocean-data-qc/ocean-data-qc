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

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const rmdir = require('rimraf');
const urlExists = require('url-exists');
const fs = require('fs');
const { spawn } = require('child_process');
const python_shell = require('python-shell');

const lg = require('logging');
const loc = require('locations');
const tools = require('tools');
const data = require('data');


module.exports = {
    go_to_bokeh: function() {
        lg.info('-- GO TO BOKEH');
        var self = this;
        tools.show_loader();
        var _checkBokehSate = setInterval(function() {
            lg.info('>> CHECK BOKEH STATE');
            // NOTE: check if bokeh loading, the tile server and the octave detection are already done
            if ($('#octave_version').text() != 'Checking...') {
                lg.warn('>> OCTAVE DETECTION IS NOT FINISHED YET')
            }
            if ($('body').data('bokeh_state') == 'ready' && $('body').data('ts_state') != 'checking' && $('#octave_version').text() != 'Checking...') {
                clearInterval(_checkBokehSate);
                if ($('body').data('ts_state') == 'offline') {
                    ipcRenderer.send('run-tile-server');
                }
                self.init_bokeh()
            }
        }, 100);
    },

    init_bokeh: function() {
        var self = this;
        var call_params = {
            'object': 'bokeh.loader',
            'method': 'init_bokeh',
            'args': {
                'ts_state': $('body').data('ts_state'),
            }
        }
        tools.call_promise(call_params).then((result) => {
            self.run_on_ready();
        });
    },

    go_to_welcome: function() {
        // the loader is not needed here, very fast transition
        $('#bokeh_iframe').fadeOut('slow', function(){
            $('.welcome_container').fadeIn('slow');
        });
    },

    reset_bokeh: function() {
        var self = this;
        var call_params = {
            'object': 'bokeh.loader',
            'method': 'reset_bokeh',
        }
        tools.call_promise(call_params).then((result) => {
            lg.info('-- RESETING BOKEH');
            self.go_to_welcome();
            ipcRenderer.send('set-main-menu');
        });
    },

    reset_bokeh_cruise_data: function() {
        var self = this;
        var call_params = {
            'object': 'bokeh.loader',
            'method': 'reset_env_cruise_data',
        }
        tools.call_promise(call_params).then((result) => {
            lg.info('-- RESETING BOKEH AND CRUISE DATA');
            self.go_to_welcome();
            ipcRenderer.send('set-main-menu');
        });
    },

    reload_bokeh: function(callback=null) {
        var self = this;
        tools.show_loader();
        var call_params = {
            'object': 'bokeh.loader',
            'method': 'reload_bokeh',
        }
        tools.call_promise(call_params).then((result) => {
            lg.info('-- RELOADING BOKEH');
            self.run_on_ready();
            tools.hide_loader();
            if (callback != null) {
                callback();
            }
        });
    },

    run_on_ready: function() {
        var self = this;
        lg.info('-- RUN ON READY');
        document.getElementById('bokeh_iframe').contentWindow.postMessage({
            'signal': 'on-ready',
            'message_data': 'continue'
        } , '*');  // to index.html

        // This waits for the back signal 'on-ready' in the main_renderer.js file
    },

    run_on_ready_final_step: function() {
        lg.info('-- ON-READY SIGNAL, FINAL STEP');
        var self = this;
        // TODO: check if it is an aqc (mark watcher as saved file) or a csv file (mark as modified)

        var project_file = data.get('project_file', loc.proj_settings);
        var project_state = 'modified';
        if (project_file != false) {
            data.set({'project_state': 'saved'}, loc.shared_data);  // although it should be saved already
            project_state = 'saved';
        } else {
            data.set({'project_state': 'modified'}, loc.shared_data);
            project_state = 'modified';
        }
        ipcRenderer.send('enable-watcher', {
            'mark': project_state,
            'set_bokeh_menu': true
        });
        tools.show_default_cursor();
        tools.hide_loader();
    },

    come_back_to_welcome: function(reset_cruise_data=false) {
        lg.info('-- COME BACK TO WELCOME --');
        var self = this;
        document.title = 'AtlantOS Ocean Data QC!';
        ipcRenderer.send('disable-watcher');
        rmdir(loc.proj_files, function (err) {
            if (err) {
                tools.showModal(
                    'ERROR',
                    'Something was wrong deleting temporal files:<br />' + err
                );
                return;
            }
            lg.info('Project files deleted');
            if (reset_cruise_data) {
                self.reset_bokeh_cruise_data();
            } else {
                self.reset_bokeh();
            }
        });
    },

    /* Checks if the command Octave exists in the PATH environment variable
    *  If it does not exist, then Octave cannot be used
    *       @manual_octave_path != false: The path is being set manually
    */
    set_octave_path: function(manual_octave_path=false) {
        lg.info('-- SET OCTAVE PATH METHOD');
        var self = this;
        if (manual_octave_path != false) {
            if (fs.existsSync(tools.file_to_path(manual_octave_path))) {
                self.octave_path = manual_octave_path;
                self.set_octave_exe_path();
            }
        } else {
            self.octave_path = data.get('octave_path', loc.shared_data);
            if (self.octave_path == false || (self.octave_path != false && !fs.existsSync(tools.file_to_path(self.octave_path)))) {
                self.guess_octave_exe_path();
            } else {  // path is already set
                self.set_octave_exe_path();
            }
        }
    },

    set_octave_version() {
        lg.info('-- SET OCTAVE VERSION')
        var self = this;
        self.octave_version = false;

        if (self.octave_path == false) {
            self.set_octave_info('Undetected');
            data.set({'octave_version': false}, loc.shared_data);
            data.set({'octave_path': false}, loc.shared_data);
            return;
        }

        var full_str_version = '';
        const octave = spawn(
            tools.file_to_path(self.octave_path),   // command >> is this working on mac an linux?
            ['--eval', '"OCTAVE_VERSION"'],         // args
            {'shell': true }                        // options
        );
        octave.stdout.on('data', (buffer) => {
            var version = buffer.toString('utf8');
            full_str_version += version;
            if (full_str_version.match(/ans = [0-9]\.[0-9]\.[0-9]/g) != null) {
                // NOTE: When the expression is full (all buffers concatenated)
                //       Expected answer: "ans = 4.1.4"
                self.octave_version = full_str_version.split('=')[1].trim();
                data.set({'octave_version': self.octave_version}, loc.shared_data);
                self.set_octave_info()
            }
        });
        octave.stderr.on('data', (data) => {
            self.set_octave_info(`Error detecting Octave version: ${data}`);
            data.set({'octave_version': false}, loc.shared_data);
            data.set({'octave_path': false}, loc.shared_data);
        });
    },

    set_octave_info: function(msg=false) {
        lg.info('-- SET OCTAVE INFO')
        var self = this;
        if (self.octave_version != false) {
            $('#octave_version').text(self.octave_version);
            $('#octave_version').css('color', 'black');
            $('#octave_version').css('font-weight', 'normal');
            $('#set_octave_path_manually').css('display', 'none');
        } else {
            lg.warn('>> OCTAVE UNDETECTED');
            if (msg != false) {
                $('#octave_version').text(msg + '. ');
            } else {
                $('#octave_version').text('Undetected. ');
            }
            $('#octave_version').css('color', 'red');
            $('#octave_version').css('font-weight', 'bold');

            $('#set_octave_path_manually').css('display', 'inline');
        }
    },

    guess_octave_exe_path: function() {
        lg.info('-- GUESS OCTAVE EXE PATH')
        var self = this;
        var params = {
            'object': 'octave.equations',
            'method': 'guess_oct_exe_path'
        }
        tools.call_promise(params).then((results) => {
            if (typeof(results) === 'undefined') {
                lg.warn('>> Octave undetected in PATH');
                data.set({'octave_path': false, 'octave_version': false, }, loc.shared_data);
                self.set_octave_info('Undetected');
            } else {
                self.octave_path = results['octave_path'];
                data.set({'octave_path': self.octave_path }, loc.shared_data);
                self.set_octave_version();
            }
        })
    },

    set_octave_exe_path: function() {
        var self = this;
        var params = {
            'object': 'octave.equations',
            'method': 'set_oct_exe_path',
            'args': self.octave_path,
        }
        tools.call_promise(params).then((results) => {
            if (typeof(results) === 'undefined' || results == null) {
                lg.warn('>>Error detecting Octave executable');
                data.set({'octave_path': false, 'octave_version': false, }, loc.shared_data);
                self.set_octave_info('Undetected in PATH');
            } else {
                self.octave_path = results['octave_path'];
                data.set({'octave_path': self.octave_path }, loc.shared_data);
                self.set_octave_version();
            }
        });
    },

    /* This method is used to add a hash file as a parameter in the links to css files.
    *  The files will be loaded from cache only if there are no new changes.
    *
    *  There is a simpler solution using the timestamp, but in this case the files
    *  would be always reloaded: https://stackoverflow.com/a/8331646/4891717
    */
    get_css_checksums: function() {
        lg.info('-- GET CSS CHECKSUMS');
        var self = this;
        var py_options = {
            mode: 'text',
            pythonPath: self.python_path,
            scriptPath: loc.scripts,
        };
        self.shell = python_shell.run('get_css_checksums.py', py_options, function (err, results) {
            if (err || typeof(results) == 'undefined') {  // The script get_module_path.py did not return the correct path
                lg.error('Error running get_css_checksums.py: ' + err);
            } else {
                results = results[0]
                results = results.replace(/'/g,'"');
                results = results.replace('\r','');
                results = JSON.parse(results);  // try catch ??
                console.log(results)
                $.each(results, function(key, value) {
                    if (key == 'electron_css_path') {
                        $.each(results[key], function(file_name, hash) {
                            var css = $("link[href$='" + file_name + "']");
                            css.attr('href', css.attr('href') + '?v=' + hash);
                        });
                        $('.welcome_container').fadeIn(500);
                    } else if (key == 'bokeh_css_path' || key == 'bokeh_js_path') {
                        // NOTE: I need to wait for bokeh here in order to assign the hashes to the css files
                        var _check_bokeh_loaded = setInterval(function() {
                            if ($('body').data('bokeh_state') == 'ready') {
                                clearInterval(_check_bokeh_loaded);
                                $.each(results[key], function(file_name, hash) {
                                    if (key == 'bokeh_css_path') {
                                        // operator $= : https://www.w3schools.com/jquery/sel_attribute_end_value.asp
                                        var css = $("#bokeh_iframe").contents().find("link[href$='" + file_name + "']");
                                        css.attr('href', css.attr('href') + '?v=' + hash);
                                    } else if (key == 'bokeh_js_path') {
                                        var js = $("#bokeh_iframe").contents().find("script[src$='" + file_name + "']");
                                        js.attr('src', js.attr('src') + '?v=' + hash);
                                    }
                                });
                            }
                        }, 100);
                    }
                });
            }
        });
    },

    check_tile_server_state: function() {
        lg.info('-- CHECK TILE SERVER STATE')
        // check ArcGIS Tile Server State
        urlExists('https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/0/0/0', function(err, exists) {
            if (exists) {
                lg.info('Tile server online');
                $('body').data('ts_state', 'online');

                $('#argis_tile_server_state').text('Online');
                $('#argis_tile_server_state').css('color', 'green');
            } else {
                lg.warn('Tile server offline, or there is no internet connection');
                $('body').data('ts_state', 'offline');

                $('#argis_tile_server_state').text('Offline');
                $('#argis_tile_server_state').css('color', 'red');
            }
            $('#argis_tile_server_state').css('font-weight', 'bold');
        });
    }
}