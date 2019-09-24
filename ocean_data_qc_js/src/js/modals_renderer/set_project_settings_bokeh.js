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
const lg = require('logging');
const data = require('data');
const tools = require('tools');
const server_renderer = require('server_renderer');

const set_project_settings_user = require('set_project_settings_user');

module.exports = {
    init: function(){
        ipcRenderer.on('project-settings-bokeh', (event, args) => {
            lg.info('-- SET PROJECT SETTINGS BOKEH')
            var self = this;
            var url = path.join(loc.modals, 'set_project_settings_user.html');
            tools.load_modal(url, () => {
                $('#project_name').val(data.get('project_name', loc.proj_settings));

                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'get_cruise_data_columns'
                }
                tools.call_promise(params).then((cols_dict) => {
                    // lg.warn('>> COLUMNS: ' + JSON.stringify(cols_dict, null, 4));
                    self.file_columns = cols_dict['cols'];
                    self.cps_columns = cols_dict['cps'];
                    self.params = cols_dict['params'];
                    var qc_plot_tabs = data.get('qc_plot_tabs', loc.proj_settings);
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

                    // update set_project_settings_user columns
                    // update by csv could add more columns to the project before
                    set_project_settings_user.update_column_params(
                        self.file_columns,
                        self.cps_columns,
                        self.params
                    );

                    set_project_settings_user.create_qc_tab_tables(qc_plot_tabs_final);
                    set_project_settings_user.load_buttons();

                    $('.accept_and_plot').on('click', function() {
                        // validations
                        if($('#project_name').val() == '') {
                            tools.show_modal({
                                'msg_type': 'html',
                                'type': 'VALIDATION ERROR',
                                'msg': '<p>The project name field must be filled.</p> <p>It is a required field.</p>',
                            });
                            return;
                        }
                        if ($('#qc_tabs_table-0').length == 0) {
                            tools.show_modal({
                                'type': 'VALIDATION ERROR',
                                'msg': 'At least there should be one tab with plots filled.'
                            });
                            return;
                        }

                        // TODO: check also at least 1 element inside the tab

                        data.set({'project_name': $('#project_name').val(),}, loc.proj_settings);
                        data.set({'project_state': 'modified',}, loc.shared_data);

                        var first = true;
                        var qc_plot_tabs = {}
                        $('fieldset').each(function() {
                            if (first == true) {
                                first = false;
                            } else {
                                var tab = $(this).find('select[name=tab_title]').val();
                                lg.info('>> CURRENT TAB: ' + tab);
                                qc_plot_tabs[tab] = []
                                var first_row = true;
                                $(this).find('.qc_tabs_table_row').each(function() {
                                    // lg.info('>> CURRENT ROW (TITLE): ' + $(this).find('input[name=title]').val());
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
                        lg.info('>> PROJECT SETTINGS: ' + JSON.stringify(loc.proj_settings, null, 4));
                        $('#dummy_close').click();
                        server_renderer.reload_bokeh();
                    });

                    $('#modal_trigger_set_project_settings').click();
                });
            });
        });
    },

}