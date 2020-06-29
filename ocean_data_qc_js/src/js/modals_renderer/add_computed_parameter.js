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
const logger = require('logging');
const data = require('data');
const tools = require('tools');

const add_computed_parameter_expression = require('add_computed_parameter_expression')

module.exports = {
    init: function(){
        var self = this;
        ipcRenderer.on('add-computed-parameter', (event, args) => {
            // default and custom parameters
            var url = path.join(loc.modals, 'add_computed_parameter.html');
            tools.load_modal(url, () => {
                self.added_list = $('select[name=added_computed_param]');
                self.available_list = $('select[name=available_computed_param]');
                self.cur_plot_columns = self.get_current_plotted_columns();

                self.load_data();
                self.events();
            });
        })
    },

    load_data: function() {
        var self = this;
        var params = {
            'object': 'computed.parameter',
            'method': 'get_all_parameters',
        }
        tools.call_promise(params).then((result) => {
            // var current_cps = data.get('computed_params', loc.proj_settings);
            // logger.info('>> GET ALL PARAMETERS RESULT: ' + JSON.stringify(result, null, 4));
            if (result != null && 'dependencies' in result && 'columns' in result) {
                var dep = result['dependencies'];
                var cp_cols = result['computed'];       // current computed columns
                var columns = result['columns'];
                var cp = [];
                Object.keys(dep).forEach(function(elem) {
                    if (dep[elem] == true) {
                        cp.push(elem);
                    }
                });
                cp.forEach(function (c) {
                    // TODO: there is a problem here when some computed parameter has the same name as a column name
                    if (cp_cols.includes(c)) {
                        self.added_list.append($('<option>', {        // left list
                            value: c,
                            text : c
                        }));
                    } else if (!columns.includes(c)) {
                        self.available_list.append($('<option>', {    // right list
                            value: c,
                            text : c
                        }));
                    }
                });
                add_computed_parameter_expression.sort_select_list(self.available_list);

                $('#modal_trigger_add_computed_parameter').click();
            }
        });
    },

    events() {
        var self = this;
        $('#move_left').click(() => {
            self.add_cp_to_added_list();
        });

        self.available_list.dblclick(() => {
            self.add_cp_to_added_list();
        });


        $('#move_right').click(() => {
            self.remove_from_added_list();
        });

        self.added_list.dblclick(() => {
            self.remove_from_added_list();
        });


        $('#add_new_computed_param').click(() => {
            add_computed_parameter_expression.init();
        });
    },

    sort_select_list: function(list) {
        var options = list.find('option');
        options.sort(function(a,b) {
            a = a.text.toLowerCase()
            b = b.text.toLowerCase()
            if (a > b) return 1;
            if (a < b) return -1;
            return 0
        });
        list.empty().append(options);
    },

    add_cp_to_added_list: function() {
        // apply and create the column in the dataframe
        var self = this;
        var value = self.available_list.val();
        if (typeof(value) !== 'undefined') {
            var params = {
                'object': 'computed.parameter',
                'method': 'add_computed_parameter',
                'args': {'value': value }
            }
            tools.call_promise(params).then((result) => {
                logger.info('>> COMPUTED PARAMETER RESULT: ' + JSON.stringify(result, null, 4));
                if (result == null) {
                    tools.showModal('ERROR', 'Result is NULL')
                }
                if ('success' in result && result['success'] == true) {
                    self.available_list.find('option:selected').detach().appendTo(self.added_list);
                    self.sort_select_list(self.added_list);
                } else {
                    if ('error' in result) {
                        tools.showModal('ERROR', result.msg, '', false, result.error);
                    } else {
                        tools.showModal('ERROR', result.msg);
                    }
                }
            });
        } else {
            tools.showModal('ERROR','You should select a parameter to move');
        }
    },

    remove_from_added_list: function() {
        var self = this;
        var value = self.added_list.val();

        if (self.cur_plot_columns.includes(value)) {
            tools.showModal('ERROR', 'You cannot remove a column that´s already plotted. '
                                   + 'Remove it from the layout first');
        } else {
            // Delete column in self.df and in self.cols
            var params = {
                'object': 'computed.parameter',
                'method': 'delete_computed_parameter',
                'args': {'value': value }
            }
            tools.call_promise(params).then((result) => {
                logger.info('>> DELETE RESULT: ' + result);
                if ('success' in result && result['success'] == true) {
                    self.added_list.find('option:selected').detach().appendTo(self.available_list);
                    self.sort_select_list(self.available_list);
                } else {
                    tools.showModal('ERROR', 'The computed parameter could not be removed from the dataframe')
                }
            });
        }
    },

    get_current_plotted_columns: function() {
        var self = this;
        var qc_plot_tabs = data.get('qc_plot_tabs', loc.proj_settings);
        var cur_plot_columns = [];
        Object.keys(qc_plot_tabs).forEach(function(tab) {  // replace forEach with a for loop
            qc_plot_tabs[tab].forEach(function(plot) {
                if (!cur_plot_columns.includes(plot['x'])) {
                    cur_plot_columns.push(plot['x']);
                }
                if (!cur_plot_columns.includes(plot['y'])) {
                    cur_plot_columns.push(plot['y']);
                }
            });
        });
        return cur_plot_columns;
    }
}