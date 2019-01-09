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

const lg = require('logging');
const loc = require('locations');
const tools = require('tools');
const watcher = require('watcher_renderer');
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
        // lg.warn('>> CHECKBOX OBJECT: ' + JSON.stringify($('.fixed_profiles_cb'), null, 4));
        // $('.fixed_profiles_cb').before('<p>Test</p>');  // this has to be run inside the iframe

        document.getElementById('bokeh_iframe').contentWindow.postMessage({
            'signal': 'on-ready',
            'message_data': 'continue'
        } , '*');  // to index.html

        // This waits for the back signal 'on-ready' in the main_renderer.js file
    },

    run_on_ready_final_step: function() {
        var self = this;
        lg.warn('>> ON-READY SIGNAL, FINAL STEP');
        ipcRenderer.send('set-bokeh-menu');
        var project_state = data.get('project_state', loc.shared_data);
        watcher.enable_watcher(project_state);
        tools.show_default_cursor();
        self.hide_loader();
    }
}