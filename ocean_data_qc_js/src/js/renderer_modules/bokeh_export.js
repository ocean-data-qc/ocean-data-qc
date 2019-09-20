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

const { dialog } = require('electron').remote;
const fs = require('fs');

const lg = require('logging');
const loc = require('locations');
const tools = require('tools');
const data = require('data');


module.exports = {
    export_pdf_file: function() {
        var self = this;
        lg.warn('-- EXPORT PDF FILE (server_renderer.js)');

        var params = {
            'object': 'bokeh.export',
            'method': 'prep_bigger_plots',
        }
        tools.call_promise(params).then((result) => {
            if (result != null && typeof(result['success']) !== 'undefined') {
                lg.warn('prep_bigger_plots SUCCESS VALUE: ' + result['success']);
                self.get_tab_images();
                var params = {
                    'object': 'bokeh.export',
                    'method': 'export_pdf',
                    'args': {
                        'tabs_images': self.tabs_images,
                        'tabs_order': self.tabs_order
                    }
                }
                tools.call_promise(params).then((result) => {
                    if (result != null && typeof(result['success']) !== 'undefined') {
                        lg.warn('SUCCESS VALUE: ' + result['success']);
                        self.save_pdf();
                    }
                });
            }
        });


    },

    get_tab_images: function() {
        lg.warn('-- GET TAB IMAGES');
        var self = this;
        self.tabs_order = []
        self.tabs_images = {}

        var iframe = $("#bokeh_iframe").contents();
        var tabs_title = iframe.find('.bk-tabs-header .bk-tab');
        $.each(tabs_title, function(tab_title_index, tab_title_dom) {
            self.tabs_order.push($(tab_title_dom).html())
        });
        var tabs = iframe.find(".tabs_widget_col>div>div:not('.bk-tabs-header')");

        $.each(tabs, function(tab_index, tab_dom){
            var canvas_dom = $(tab_dom).find('.bk-canvas');
            var images = []
            $.each(canvas_dom, function(canvas_key, canvas){
                images.push(canvas.toDataURL("image/png", 1.0));
            });
            self.tabs_images[self.tabs_order[tab_index]] = images;
            images = [];
        });
    },

    save_pdf: function() {
        var self = this;
        var project_name = data.get('project_name', loc.proj_settings);
        var moves_name = '';
        if (project_name == false) {
            moves_name = 'plot_images.pdf';
        } else {
            moves_name = project_name + '_plot_images.pdf';
        }
        dialog.showSaveDialog({
                title: 'Export plots in pdf',
                defaultPath: '~/' + moves_name,
                filters: [{ extensions: ['pdf'] }]
            }, function (fileLocation) {
                if (typeof(fileLocation) !== 'undefined') {
                    var exported_pdf_path = path.join(loc.proj_export, 'plot_images.pdf')

                    var read = fs.createReadStream(exported_pdf_path);
                    read.on("error", function(err) {
                        tools.show_modal({
                            'type': 'ERROR',
                            'msg': 'The file could not be saved!'
                        });
                    });

                    var write = fs.createWriteStream(fileLocation);
                    write.on("error", function(err) {
                        tools.show_modal({
                            'type': 'ERROR',
                            'msg': 'The file could not be saved!'
                        });
                    });
                    write.on("close", function(ex) {
                        tools.show_snackbar('File saved!')
                    });
                    read.pipe(write);

                    self.restore_plot_sizes();
                }
            }
        );
    },

    restore_plot_sizes: function() {
        lg.warn('-- RESTORE PLOT SIZES');
        var self = this;
        var params = {
            'object': 'bokeh.export',
            'method': 'restore_plot_sizes',
        }
        tools.call_promise(params).then((result) => {
            if (result != null && typeof(result['success']) !== 'undefined') {
                lg.warn('restore_plot_sizes SUCCESS VALUE: ' + result['success']);

                // TODO:restore spinning here
            }
        });
    }
}