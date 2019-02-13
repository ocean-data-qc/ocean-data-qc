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
const { spawn } = require('child_process');
const which = require('npm-which')(process.cwd())
const rmdir = require('rimraf')

const lg = require('logging');
const loc = require('locations');
const tools = require('tools');
const data = require('data');


module.exports = {
    go_to_bokeh: function() {
        lg.info('-- GO TO BOKEH');
        var self = this;
        if (typeof($('.loader_container').attr('hidden')) !== 'undefined') {
            self.show_loader();
        }
        var _checkBokehSate = setInterval(function() {
            lg.info('>> CHECK BOKEH STATE');
            if ($('body').data('bokeh_state') == 'ready') {  // check if bokeh is already loaded
                clearInterval(_checkBokehSate);
                var call_params = {
                    'object': 'bokeh.loader',
                    'method': 'init_bokeh',
                }
                tools.call_promise(call_params).then((result) => {
                    self.run_on_ready();
                });
            }
        }, 100);
    },

    show_loader: function() {
        $('#welcome_container').attr('hidden', '');
        $('#bokeh_iframe').attr('hidden', '');
        $('.loader_container').removeAttr('hidden');
    },

    hide_loader: function() {
        $('#bokeh_iframe').removeAttr('hidden');
        $('.loader_container').attr('hidden', '');
    },

    go_to_welcome: function() {
        // the loader is not needed here, very fast transition
        $('#bokeh_iframe').attr('hidden', '');
        $('#welcome_container').removeAttr('hidden');
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

    reload_bokeh: function(callback=null) {
        var self = this;
        self.show_loader();
        var call_params = {
            'object': 'bokeh.loader',
            'method': 'reload_bokeh',
        }
        tools.call_promise(call_params).then((result) => {
            lg.info('-- RELOADING BOKEH');
            self.hide_loader();
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
        ipcRenderer.send('set-bokeh-menu');

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
        ipcRenderer.send('enable-watcher', {'mark': project_state });
        tools.show_default_cursor();
        self.hide_loader();
    },

    /* Check if the command Octave exists in the PATH environment variable
    * If it does not exist, then Octave cannot be used
    */
   check_octave: function() {
        which('octave', function(err, path_to_octave) {
            if (err) {
                lg.warn('>> The "octave" command was not found: ' + err.message);
                data.set({'octave': false }, loc.shared_data);
                $('#octave_version').text('Undetected in PATH');
                $('#octave_version').css('color', 'red');
                $('#octave_version').css('font-weight', 'bold');
            } else {
                lg.info('>> OCTAVE FOUND IN: ' + path_to_octave);
                var full_str_version = '';
                const octave = spawn(
                    'octave',                           // command
                    ['--eval', '"OCTAVE_VERSION"'],     // args
                    {'shell': true }                    // options
                );
                octave.stdout.on('data', (buffer) => {
                    var version = buffer.toString('utf8');
                    full_str_version += version;
                    if (full_str_version.match(/ans = [0-9]\.[0-9]\.[0-9]/g) != null) {
                        // when the expression is full (all buffers concatenated)
                        full_str_version = full_str_version.split('=')[1].trim();
                        data.set({'octave': true }, loc.shared_data);
                        $('#octave_version').text(full_str_version);
                    }
                });
                octave.stderr.on('data', (data) => {
                    lg.error(`stderr: ${data}`);
                });
            }
        })
    },

    come_back_to_welcome: function() {
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
            self.reset_bokeh();
        });
    }
}