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

const loc = require('locations');
const lg = require('logging');
const tools = require('tools');
const server_renderer = require('server_renderer');
const update_values_by_station = require('update_values_by_station');

module.exports = {
    init: function(comparisons){
        var self = this;
        self.comparisons = comparisons;
        $('body').data('comparisons', comparisons);
        lg.info('-- COMPARISONS');
        lg.info(JSON.stringify(self.comparisons, null, 4));
        var url = path.join(loc.modals, 'update_from_external_file.html');
        tools.load_modal(url, function() {
            self.destroy();

            lg.info('>> COMPARISON DATA (JSON): ' + JSON.stringify(self.comparisons, null, 4))
            self.load_values();

            $('input[name=diff_val_qty]').click(function() {
                if (typeof(self.comparisons) === 'undefined') {
                    self.comparisons = $('body').data('comparisons');
                }
                if ($(this).is(':checked')) {
                    $('#diff_val_qty').text(
                        self.comparisons.diff_val_qty + ' / ' + self.comparisons.diff_val_qty
                    );
                } else {
                    $('#diff_val_qty').text(
                        '0 / ' + self.comparisons.diff_val_qty
                    );
                }
            });

            $('#modal_accept_all_changes').click(function() {
                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'update_from_csv',
                    'args': {
                        'selected': true,  // do not discard changes
                        'add_cols': true,
                        'rmv_cols': true,
                        'add_rows': true,
                        'rmv_rows': true,
                        'diff_val_qty': true,  // if true then all the values are updated
                    }
                }
                tools.call_promise(params).then((result) => {
                    lg.info('-- RESULT: ' + JSON.stringify(result, null, 4));
                    if (result != null && 'success' in result) {
                        server_renderer.reload_bokeh(function() {
                            tools.show_snackbar('Values updated correctly');
                        });
                    }
                });

                // TODO: Warn the user if there are some of the elements selected
                //       because maybe this is not what the user wants to do
            });

            $('#modal_accept_selected_changes').on('click', function() {
                var diff_values = false;
                if (typeof($('body').data('diff_values')) !== 'undefined') {
                    diff_values = $('body').data('diff_values');
                }
                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'update_from_csv',
                    'args': {
                        'selected': true,  // do not discard changes
                        'add_cols': $('input[name=add_cols]').is(':checked'),
                        'rmv_cols': $('input[name=rmv_cols]').is(':checked'),
                        'add_rows': $('input[name=add_rows]').is(':checked'),
                        'rmv_rows': $('input[name=rmv_rows]').is(':checked'),
                        'diff_val_qty': $('input[name=diff_val_qty]').is(':checked'),
                        'diff_values': diff_values          // TODO and if this is not defined?
                    }
                }
                tools.call_promise(params).then((result) => {
                    lg.info('-- RESULT: ' + JSON.stringify(result, null, 4));
                    if (result != null && 'success' in result) {
                        server_renderer.reload_bokeh(function() {
                            tools.show_snackbar('Values updated correctly');
                        });
                    }
                });
            });

            $('#modal_discard').on('click', function() {  // TODO: What happends if I press the X?
                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'update_from_csv',
                    'args': {
                        'selected': false,
                    }
                }
                tools.call_promise(params).then((result) => {
                    lg.info('>> CHANGES DISCARDED');
                });

                // TODO: mark previous state in the watcher
            });
            update_values_by_station.init();
            $('#modal_trigger_update_from_external_file').click();
        });

    },
    load_values: function() {
        var self = this;
        if (self.comparisons.modified == true) {
            // NEW COLUMNS
            if (self.comparisons.add_cols.length > 0) {
                $('#add_cols_value').text(self.comparisons.add_cols.join(', '));
            } else {
                $('#add_cols_value').text('None');
                $('#add_cols_input').attr('disabled', true);
            }

            // REMOVED COLUMNS
            if (self.comparisons.rmv_cols.length > 0) {
                $('#rmv_cols_value').text(self.comparisons.rmv_cols.join(', '));

                // check if the removed columns are currently plotted and show a warning
                if (self.comparisons.rmv_plot_cols.length > 0) {
                    var rmv_plot_cols_str = self.comparisons.rmv_plot_cols.join(', ');
                    $('#rmv_cols_value').closest('tbody').append($('<tr>').append($('<td>', {
                            colspan: '3',
                            class: 'remove_warning'
                        }).append($('<div>', {
                                    class: 'alert alert-warning',
                                    role: 'alert',
                                    html: '<strong>Warning!</strong> '
                                          + 'The following columns will be removed from the layout as well: '
                                          + rmv_plot_cols_str
                                })
                            )
                        )
                    );
                }
            } else {
                $('#rmv_cols_value').text('None');
                $('#rmv_cols_input').attr('disabled', true);
            }

            // REMOVED CPS COLUMNS
            if (self.comparisons.rmv_plot_cps.length > 0) {
                var rmvd_ccp_plotted_str = self.comparisons.rmv_plot_cps.join(', ');
                lg.warn('>> REMOVED CPS STR: ' + rmvd_ccp_plotted_str);
                $('#rmv_cols_value').closest('tbody').append($('<tr>').append($('<td>', {
                        colspan: '3',
                        class: 'remove_warning'
                    }).append($('<div>', {
                                class: 'alert alert-warning',
                                role: 'alert',
                                html: '<strong>Warning!</strong> The following calculated columns will be removed '
                                      + 'from the layout. They cannot be calculated if the previous columns are removed: '
                                      + rmvd_ccp_plotted_str
                            })
                        )
                    )
                );
                // $('#rmv_cols_input').attr('disabled', true);
            }

            // NEW ROWS
            if (self.comparisons.add_rows != 0) {
                $('#add_rows_value').text(self.comparisons.add_rows);
            } else {
                $('#add_rows_value').text('None');
                $('#add_rows_input').attr('disabled', true);
            }

            // REMOVED ROWS
            if (self.comparisons.rmv_rows != 0) {
                $('#rmv_rows_value').text(self.comparisons.rmv_rows);
            } else {
                $('#rmv_rows_value').text('None');
                $('#rmv_rows_input').attr('disabled', true);
            }

            // MODIFIED VALUES
            if (self.comparisons.diff_val_qty != 0) {
                $('#diff_val_qty').text('0 / ' + self.comparisons.diff_val_qty);
            } else {
                $('#diff_val_qty').text('None');
                $('#diff_val_qty_input').attr('disabled', true);
                $('#update_values_by_station').remove();
            }
        } else {
            $('div.modal-body').text('No changes have been found');
            $('#modal_accept_all_changes').attr('hidden', '');
            $('#modal_accept_selected_changes').attr('hidden', '');
        }
    },

    destroy: function() {
        // This is run when the modal is unloaded
        $(document).on('hidden.bs.modal', '#update_from_external_file', function () {
            $('body').removeData('comparisons');
            $('body').removeData('diff_values');
            $('body').removeData('selected_param');
        });
    }
}
