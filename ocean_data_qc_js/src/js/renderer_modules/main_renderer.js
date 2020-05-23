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
const rmdir = require('rimraf');
const fs = require('fs');
const is_dev = require('electron-is-dev');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const data_renderer = require('data_renderer');
const tools = require('tools');
const server_renderer = require('server_renderer');
const bokeh_export = require('bokeh_export');
const tab_app = require('tab_app');

require('tab_project').init();
require('tab_app').init();

// ---------------------------- INITIAL FUNCTIONS ----------------------------- //

server_renderer.init();
data_renderer.ipc_renderer = ipcRenderer;

$('body').data('bokeh_state', 'not-ready');  // bokeh server state: 'not-ready', 'ready'
$('body').data('ts_state', 'checking');      // tile server state: 'checking', 'offline', 'online'
$('body').data('oct_state', 'checking');     // octave state: 'checking', 'checked'

tools.multi_modal_fix();
tools.popover_fix();
server_renderer.load_images();

$('.possible_formats').attr({
    'data-toggle': 'popover',
    'data-placement': 'right',
    'data-html': true,
    'data-content': $('#possible_formats').html()
});
tools.load_popover();

$(document).ready(function() {
    // NOTE: Doing this we avoid to send the form with a submit button
    //       This avoid the screen flickering, making a more credible desktop application

    $(window).keydown(function(event){
        if(event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });
});

if (is_dev) {
    $('#update_state').text('Running on development').addClass('update_error');
}

// -------------------- RECEIVING MESSAGES FROM THE BOKEH IFRAME ------------------ //

window.onmessage = function(e){
    if (e.data == 'bokeh-loaded') {                    // bokeh completely loaded
        lg.info('-- BOKEH LOADED');

        $('#bokeh_info').css('color', 'green');
        $('#bokeh_state').text(bokeh_iframe.contentWindow.Bokeh.version + ' (loaded)');
        $('#bokeh_state_loader').attr('hidden', '');
        $('body').data('bokeh_state','ready');

        // NOTE: be careful here, only one call to bokeh at the same time is possible
        server_renderer.check_tile_server_state();
        server_renderer.set_octave_path();
    }

    if (typeof(e.data.signal) !== 'undefined') {
        if (e.data.signal == 'python-response') {
            $('body').data('python_response', e.data.params);
        } else if  (e.data.signal == 'python-error') {
            $('body').data('python_error', e.data.params);
        } else if (e.data.signal == 'js-call') {
            tools.js_call(e.data.params);
        } else if (e.data.signal == 'on-ready') {
            server_renderer.run_on_ready_final_step();
        } else if (e.data.signal == 'deselect-tool' || e.data.signal == 'esc-pressed') {
            var call_params = {
                'object': 'bokeh.plots.handler',
                'method': 'deselect_tool',
            }
            tools.call_promise(call_params);
        }
    }

}

// ---------------------------- DEVELOPER MODE ENABLER ----------------------------- //

var dev_mode = data.get('dev_mode', loc.shared_data);
if (dev_mode == true) {
    $('#enable_dev_mode').text('Developer mode enabled, press to disable');
    $('#enable_dev_mode').addClass('dev_mode');
} else {
    $('#enable_dev_mode').text('Enable developer mode');
    $('#enable_dev_mode').removeClass('dev_mode');
}
$('#enable_dev_mode').closest('p').removeAttr('hidden');

$('#enable_dev_mode').click(function() {
    if ($('#enable_dev_mode').hasClass('dev_mode')) {
        data.set({'dev_mode': false }, loc.shared_data);
        $('#enable_dev_mode').text('Enable developer mode');
        $('#enable_dev_mode').removeClass('dev_mode');
    } else {
        data.set({'dev_mode': true }, loc.shared_data);
        if (!fs.existsSync(loc.log_python)) {
            $('#enable_dev_mode').text('Developer mode enabled, press to disable. You must restart the app to show the python logger');
        } else {
            $('#enable_dev_mode').text('Developer mode enabled, press to disable');
        }
        $('#enable_dev_mode').addClass('dev_mode');
    }
});

// ------------------------------- CUSTOM SETTINGS ---------------------------------- //

$('#json_template_restore_to_default>a').click(function() {
    server_renderer.json_template_restore_to_default();
});

$('#json_template_download_custom>a').click(function() {
    data_renderer.download_custom_json_template();
});

$('#json_template_upload_custom>a').click(function() {
    data_renderer.upload_custom_json_template();
});

// ------------------------------- HOME LINKS ---------------------------------- //

$('#set_octave_path_manually').click(function() {
    ipcRenderer.send('open-octave-path-dialog');
});

$('#open_file').on('click', function (){
    ipcRenderer.send('open-dialog');
})

$('#modify_app_settings').on('click', function() {
    tab_app.init_form()
});

// ---------------------------------  LISTENERS ---------------------------------------------- //

ipcRenderer.on('show-modal', (event, arg) => {
    tools.showModal(arg.type, arg.msg);
});

ipcRenderer.on('show-snackbar', (event, arg) => {
    tools.show_snackbar(arg.msg);
});

ipcRenderer.on('show-wait-cursor', () => {
    tools.show_wait_cursor();
});

ipcRenderer.on('show-default-cursor', () => {
    tools.show_default_cursor();
});

ipcRenderer.on('load-bokeh-on-iframe', (event, arg) => {
    lg.info('-- LOAD BOKEH ON IFRAME');
    var bokeh_port = data.get('bokeh_port', loc.shared_data);
    $('#bokeh_iframe').attr('src', 'http://localhost:' + bokeh_port + '/ocean_data_qc')
});

ipcRenderer.on('go-to-bokeh', (event, arg) => {
    server_renderer.go_to_bokeh();
});

ipcRenderer.on('show-loader', (event, arg) => {
    tools.show_loader();
});

ipcRenderer.on('relaunch-bokeh', (event, arg) => {
    $('body').data('bokeh_state','not-ready');
    server_renderer.go_to_bokeh();
});

ipcRenderer.on('set-octave-path', (event, arg) => {
    $('body').data('oct_state', 'checking');
    server_renderer.set_octave_path(arg.manual_octave_folder_path);
});

ipcRenderer.on('export-pdf-file', (event, arg) => {
    bokeh_export.export_pdf_file();
});

ipcRenderer.on('show-custom-settings-replace', (event, arg) => {
    lg.info('-- SHOW-CUSTOM-SETTINGS-REPLACEMENT, args: ' + JSON.stringify(arg));
    if (arg['result'] == 'should_update') {  // ask question to the user, replace or keep file?
        $('#json_template_state').attr('hidden', '');

        $('#json_template_restore_to_default>strong').text('Replace custom settings file with the new version? (calculated parameters included)');
        $('#json_template_restore_to_default').removeAttr('hidden');
    } else if (arg['result'] == 'should_restore') {  // should update false, but are custom and default files equal?
        $('#json_template_state').attr('hidden', '');
        $('#json_template_restore_to_default').removeAttr('hidden');
    } else if (arg['result'] == 'restored') {
        $('#json_template_state>strong').text('Default Settings correctly restored');
        $('#json_template_state').removeClass('json_template_orange');
        $('#json_template_state').addClass('json_template_blue');

        $('#json_template_restore_to_default').attr('hidden', '');
        $('#json_template_state').removeAttr('hidden');
    } else { // result == 'sync'
        $('#json_template_state>strong').text('Settings have not been modified by the user. Nothing to restore');
        $('#json_template_state').removeClass('json_template_orange');
        $('#json_template_state').addClass('json_template_blue');

        $('#json_template_restore_to_default').attr('hidden', '');
        $('#json_template_state').removeAttr('hidden');
    }
});

ipcRenderer.on('bokeh-error-loading', (event, arg) => {
    server_renderer.bokeh_error_loading();
})
