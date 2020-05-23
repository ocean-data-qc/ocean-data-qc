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

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');
const column_app = require('column_app');


module.exports = {
    init: function(){
        lg.info('-- TAB APP');
        var self = this;
        ipcRenderer.on('tab-app', (event, args) => {
            self.init_form();
        });
    },

    init_form: function() {
        lg.info('-- INIT FORM (TAB_APP)');
        var self = this;
        tools.show_wait_cursor();
        var url = path.join(loc.modals, 'tab_app.html');
        tools.load_modal(url, function() {
            self.load_columns();
            self.load_tabs();
            self.load_buttons();
            self.load_save_button();  // different implementation in the bokeh modal form
            self.load_column_app_button();
            self.load_help_popover();

            $('#modal_trigger_tab_app').click();
            tools.show_default_cursor();
        });
    },

    load_columns: function() {
        var self = this;
        var columns = data.get('columns', loc.custom_settings);
        self.app_columns = Object.keys(columns)
        // lg.warn('>> COLUMNS: ' + JSON.stringify(self.app_columns, null, 4));

        // app_columns = params + flags
        self.params = [];
        self.app_columns.forEach(c => {  // ES6
            var f = c.substr(c.length - 7);
            if (f !== '_FLAG_W') {
                self.params.push(c);
            }
        });

        var computed_params = data.get('computed_params', loc.custom_settings);
        self.cps_columns = [];
        computed_params.forEach(function(cp) {
            self.cps_columns.push(cp['param_name']);
            self.app_columns.push(cp['param_name']);
        });
        self.app_columns.sort();
        // lg.warn('>> COMPUTED PARAM: ' + JSON.stringify(self.cps_columns, null, 4));
    },

    load_tabs: function(cols_dict=false) {
        var self = this;
        var qc_plot_tabs = data.get('qc_plot_tabs', loc.custom_settings);
        self.create_qc_tab_tables(qc_plot_tabs);
    },

    load_buttons: function() {
        var self = this;
        $('.add_new_tab').on('click', function() {
            $(".modal-body").animate({ scrollTop: $('.modal-body').prop("scrollHeight")}, 500);

            var new_fieldset = $('fieldset').first().clone();
            $('#qc_tabs_container').append(new_fieldset);
            new_fieldset.slideDown();
            self.params.forEach(function(column) {
                new_fieldset.find('select[name=tab_title]').append($('<option>', {
                    value: column,
                    text: column,
                }));
            })
            self.app_columns.forEach(function(column) {
                if (self.cps_columns.includes(column)) {
                    new_fieldset.find('.qc_tabs_table_row select').append($('<option>', {
                        value: column,
                        text : column,
                        class: 'layout_computed_param_column'
                    }));
                } else {
                    new_fieldset.find('.qc_tabs_table_row select').append($('<option>', {
                        value: column,
                        text : column
                    }));
                }
            });
            new_fieldset.find('.add_new_plot').click(function() {
                var new_row = self.get_new_row();
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
                    lg.info('>> QC TABS TABLE ID: ' + $(this).attr('id'));
                    $(this).attr('id', 'qc_tabs_table-' + index);
                    index++;
                }
            });
            self.load_row_buttons(new_fieldset);
        });

    },

    load_save_button() {
        $('.save_settings').on('click', function() {
            // validations
            if ($('#qc_tabs_table-0').length == 0) {
                tools.show_modal({
                    'type': 'VALIDATION ERROR',
                    'msg': 'At least there should be one tab with plots filled.'
                });
                return;
            }

            // TODO: check also at least 1 element inside the tab

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
            // lg.info('>> CUSTOM SETTINGS: ' + JSON.stringify(loc.custom_settings, null, 4));
            $('#dummy_close').click();
        });
    },

    load_column_app_button() {  // TODO: migrate to tab_app
        $('.column_app').on('click', function() {
            column_app.load();
        });
    },

    create_qc_tab_tables: function(qc_plot_tabs={}) {
        lg.info('-- CREATE QC TAB TABLES (TAB_APP)');
        var self = this;
        // lg.info('>> TABS: ' + JSON.stringify(qc_plot_tabs, null, 4));

        if (qc_plot_tabs == {} || self.app_columns == []) {
            // TODO: anyway, add columns from scratch should be allowed
            tools.show_modal({
                'msg_type': 'text',
                'type': 'ERROR',
                'msg': 'There are no columns in the settings form.',
            });
            return;
        }

        var index = 0;
        Object.keys(qc_plot_tabs).forEach(function(tab) {
            // TODO: check here if the tab is going to have graphs

            var new_qc_tab_div = $("#qc_tabs_table").clone();
            new_qc_tab_div.attr('id', 'qc_tabs_table-' + index);
            new_qc_tab_div.find('.add_new_plot').click(function() {
                var new_row = self.get_new_row();
                $(this).parent().parent().before(new_row);
                $('.delete_graph').on('click', function() {
                    $(this).parent().parent().remove();
                });
            });
            self.params.forEach(function (column) {
                new_qc_tab_div.find('select[name=tab_title]').append($('<option>', {
                    value: column,
                    text: column,
                }));
            });
            new_qc_tab_div.find('select[name=tab_title]').val(tab);

            qc_plot_tabs[tab].forEach(function (graph) {
                var new_row = self.get_new_row(graph);
                new_qc_tab_div.find('tbody tr:last-child').before(new_row);
            });

            new_qc_tab_div.appendTo("#qc_tabs_container").css('display', 'block');
            index++;
            self.load_row_buttons(new_qc_tab_div)
        });
    },

    load_row_buttons: function(fieldset) {
        fieldset.find('.delete_tab').on('click', function() {
            if ($('#qc_tabs_table-1').length != 0) {
                $(this).parent().parent().slideUp('fast', function() {
                    $(this).remove();
                    // reindex fieldsets
                    var index = 0;
                    var first = true;
                    $('fieldset').each(function() {
                        if (first == true) {
                            first = false;
                        } else {
                            $(this).attr('id', 'qc_tabs_table-' + index);
                            index++;
                        }
                    });
                });
            } else {
                tools.showModal(
                    'ERROR',
                    'You should show at least one tab in the layout.'
                );
            }
        });

        $('.delete_graph').on('click', function() {
            $(this).parent().parent().remove();
        });
    },

    get_new_row: function(graph=null) {
        var self = this;
        var new_row = $('#qc_tabs_table .qc_tabs_table_row').first().clone();
        self.app_columns.forEach(function (column) {
            var option_attrs = {
                value: column,
                text : column,
            };
            if (self.cps_columns.includes(column)) {
                option_attrs['class'] = 'layout_computed_param_column';  // green color
            }
            new_row.find('select[name=x_axis]').append($('<option>', option_attrs));
            new_row.find('select[name=y_axis]').append($('<option>', option_attrs));
        });
        if (graph != null) {
            new_row.find('input[name=title]').val(graph.title);
            new_row.find('select[name=x_axis]').val(graph.x);
            new_row.find('select[name=y_axis]').val(graph.y);
        }
        new_row.css('display', 'table-row');
        // lg.info('>> NEW ROW: ' + new_row.get());
        return new_row;
    },

    load_help_popover: function() {
        $('.performance_help').attr({
            'data-toggle': 'popover',
            'data-placement': 'right',
            'data-html': true,
            'data-content': $('#performance_help').html()
        });
        tools.load_popover();
    }
}