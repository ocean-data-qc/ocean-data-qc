// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const app_module_path = require('app-module-path');
app_module_path.addPath(path.join(__dirname, '../modules'));
app_module_path.addPath(path.join(__dirname, '../renderer_modules'));
app_module_path.addPath(__dirname);

const {ipcRenderer} = require('electron');
const fs = require('fs');                             // file system module
const python_shell = require('python-shell');

const loc = require('locations');
const logger = require('logging');
const data = require('data');
const tools = require('tools');

const set_project_settings_user = require('set_project_settings_user');

module.exports = {
    init: function(){
        var self = this;
        var url = path.join(loc.modals, 'set_project_settings_default.html');
        tools.load_modal(url, () => {
            self.load_layout();

            $('.delete_graph').on('click', function() {
                $(this).parent().parent().remove();  // TODO: use closest
            });

            $('#discard_plotting').on('click', function() {
                logger.info('~~ DISCARD CHANGES');
            });

            $('#add_new_tab').on('click', function() {
                var new_fieldset = $('fieldset:first').clone();
                $('fieldset:last').after(new_fieldset);
                new_fieldset.slideDown();
                self.file_columns.forEach(function (column) {
                    new_fieldset.find('select').append($('<option>', {
                        value: column,
                        text : column
                    }));
                });
                new_fieldset.find('.add_new_plot').click(function() {
                    var new_row = set_project_settings_user.getNewRow(self.file_columns);
                    $(this).parent().parent().before(new_row);
                    $('.delete_graph').on('click', function() {
                        $(this).parent().parent().remove();    // TODO: use closest
                    });
                });

                // reindex fieldsets
                var index = 0;
                var first = true;
                $('fieldset').each(function() {
                    if (first == true) {
                        first = false;
                    } else {
                        logger.info('>> QC TABS TABLE ID: ' + $(this).attr('id'));
                        $(this).attr('id', 'qc_tabs_table-' + index);
                        index++;
                    }
                });
                set_project_settings_user.loadDeleteTabButtons();
            });

            $('#save_settings').on('click', function() {
                var first = true;
                var qc_plot_tabs = {}
                $('fieldset').each(function() {
                    if (first == true) {
                        first = false;
                    } else {
                        var tab = $(this).find('select[name=tab_title]').val();
                        qc_plot_tabs[tab] = []
                        var first_row = true;
                        $(this).find('.qc_tabs_table_row').each(function() {
                            if (first_row == true) {
                                first_row = false;
                            } else {
                                var title = $(this).find('input[name=title]').val();
                                var x_axis = $(this).find('select[name=x_axis]').val();
                                var y_axis = $(this).find('select[name=y_axis]').val();
                                if (title == '') {
                                    title = x_axis + ' vs ' + y_axis;
                                }
                                qc_plot_tabs[tab].push({
                                    'title': title,
                                    'x': x_axis,
                                    'y': y_axis
                                });
                            }
                        })
                    }
                });
                data.set({'qc_plot_tabs': qc_plot_tabs }, loc.custom_settings);
            });

            $('#reset_settings').click(function() {
                // remove all elements
                $('fieldset[id^=qc_tabs_table-]').remove();
                self.load_layout('default');
            });

            $('#modal_trigger_set_project_settings').click();
        });
    },

    load_layout: function(type='custom') {
        var self = this;
        logger.info('-- LOAD DEFAULT LAYOUT');
        self.file_columns = data.get('default_columns', loc.default_settings);
        var qc_plot_tabs = {};
        if (type == 'default') {
            qc_plot_tabs = data.get('qc_plot_tabs', loc.default_settings);
        } else {
            qc_plot_tabs = data.get('qc_plot_tabs', loc.custom_settings);
        }
        var qc_plot_tabs_final = {};
        Object.keys(qc_plot_tabs).forEach(function(tab) {
            qc_plot_tabs[tab].forEach(function (graph) {
                if (self.file_columns.includes(graph.x) && self.file_columns.includes(graph.y)) {
                    if (tab in qc_plot_tabs_final) {
                        qc_plot_tabs_final[tab].push(graph);
                    } else {
                        qc_plot_tabs_final[tab] = [graph];
                    }
                }
            });
        });

        // build the form with qc_plot_tabs_final
        set_project_settings_user.createQCTabTables(qc_plot_tabs_final, self.file_columns);
        set_project_settings_user.loadDeleteTabButtons();
    },

}