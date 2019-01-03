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

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');
const watcher = require('watcher_renderer');


module.exports = {
    go_to_bokeh: function() {
        lg.info('-- GO TO BOKEH');
        var self = this;
        if ($('.loader_container').hasClass('hidden')) {
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
                    lg.info('-- INIATILIZING BOKEH');
                    ipcRenderer.send('set-bokeh-menu');

                    var project_state = data.get('project_state', loc.shared_data);
                    watcher.enable_watcher(project_state);
                    tools.show_default_cursor();
                    self.hide_loader();
                });
            }
        }, 100);
    },

    show_loader: function() {
        $('#welcome_container').addClass('hidden');
        $('#bokeh_iframe').addClass('hidden');
        $('.loader_container').removeClass('hidden');
    },

    hide_loader: function() {
        $('#bokeh_iframe').removeClass('hidden');
        $('.loader_container').addClass('hidden');
    },

    go_to_welcome: function() {
        // the loader is not needed here, very fast transition
        $('#bokeh_iframe').addClass('hidden');
        $('#welcome_container').removeClass('hidden');
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
    }
}