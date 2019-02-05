// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const app_module_path = require('app-module-path');
app_module_path.addPath(path.join(__dirname, '../modules'));
app_module_path.addPath(__dirname);

const {ipcRenderer} = require('electron');

const loc = require('locations');
const logger = require('logging');
const data = require('data');
const tools = require('tools');
const server_renderer = require('server_renderer');

const set_project_settings_user = require('set_project_settings_user');

module.exports = {
    init: function(file_columns){
        ipcRenderer.on('project-settings-bokeh', (event, args) => {
            logger.info('-- SET PROJECT SETTINGS BOKEH')
            logger.info('>> FILE COLUMNS' + file_columns);
            var self = this;
            var url = path.join(loc.modals, 'set_project_settings_user.html');
            tools.load_modal(url, () => {
                $('#project_name').val(data.get('project_name', loc.proj_settings));

                var params = {
                    'object': 'cruise.data',
                    'method': 'get_plot_cp_params'
                }
                tools.call_promise(params).then((columns) => {
                    var computed = columns['computed'];
                    var file_columns = columns['plotable_columns'];
                    var qc_plot_tabs = data.get('qc_plot_tabs', loc.proj_settings);
                    var qc_plot_tabs_final = {};
                    Object.keys(qc_plot_tabs).forEach(function(tab) {
                        qc_plot_tabs[tab].forEach(function (graph) {
                            if (file_columns.includes(graph.x) && file_columns.includes(graph.y)) {
                                if (tab in qc_plot_tabs_final) {
                                    qc_plot_tabs_final[tab].push(graph);
                                } else {
                                    qc_plot_tabs_final[tab] = [graph];
                                }
                            }
                        });
                    });

                    // build the form with qc_plot_tabs_final
                    set_project_settings_user.create_qc_tab_tables(qc_plot_tabs_final, file_columns, computed);
                    set_project_settings_user.load_delete_tab_buttons();

                    $('.delete_graph').on('click', function() {
                        $(this).parent().parent().remove();
                    });

                    $('#discard_plotting').on('click', function() {
                        logger.info('~~ DISCARD CHANGES');
                    });

                    $('#add_new_tab').on('click', function() {
                        var new_fieldset = $('fieldset:first').clone();
                        $('fieldset:last').after(new_fieldset);
                        new_fieldset.slideDown();
                        file_columns.forEach(function (column) {
                            if (!computed.includes(column)) {
                                new_fieldset.find('select').append($('<option>', {
                                    value: column,
                                    text : column
                                }));
                            }
                        });
                        new_fieldset.find('.add_new_plot').click(function() {
                            var new_row = set_project_settings_user.get_new_row(file_columns, null, computed);
                            $(this).parent().parent().before(new_row);
                            $('.delete_graph').on('click', function() {
                                $(this).parent().parent().remove();
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
                        set_project_settings_user.load_delete_tab_buttons();
                    });

                    $('#accept_and_plot').on('click', function() {
                        // validations
                        if($('#project_name').val() == '') {
                            tools.showModal(
                                'ERROR',
                                'The project name field must be filled<br />It is a required field.'
                            );
                            return;
                        }

                        data.set({
                            'project_state': 'modified',
                            'project_name': $('#project_name').val(),
                        }, loc.proj_settings);

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
                        data.set({'qc_plot_tabs': qc_plot_tabs }, loc.proj_settings);
                        // logger.info('>> PROJECT SETTINGS: ' + JSON.stringify(loc.proj_settings, null, 4));
                        server_renderer.reload_bokeh();
                    });

                    $('#modal_trigger_set_project_settings').click();
                });
            });
        });
    },

}