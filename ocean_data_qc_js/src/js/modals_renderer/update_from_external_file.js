////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

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

            $('input[name=different_values_number]').click(function() {
                if (typeof(self.comparisons) === 'undefined') {
                    self.comparisons = $('body').data('comparisons');
                }
                if ($(this).is(':checked')) {
                    $('#different_values_number').text(
                        self.comparisons.different_values_number + ' / ' + self.comparisons.different_values_number
                    );
                } else {
                    $('#different_values_number').text(
                        '0 / ' + self.comparisons.different_values_number
                    );
                }
            });

            $('#modal_accept_all_changes').click(function() {
                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'update_from_csv',
                    'args': {
                        'selected': true,  // do not discard changes
                        'new_columns': true,
                        'removed_columns': true,
                        'new_rows': true,
                        'removed_rows': true,
                        'different_values_number': true,  // if true then all the values are updated
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
                        'new_columns': $('input[name=new_columns]').is(':checked'),
                        'removed_columns': $('input[name=removed_columns]').is(':checked'),
                        'new_rows': $('input[name=new_rows]').is(':checked'),
                        'removed_rows': $('input[name=removed_rows]').is(':checked'),
                        'different_values_number': $('input[name=different_values_number]').is(':checked'),
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
            if (self.comparisons.new_columns.length > 0) {
                $('#new_columns_value').text(self.comparisons.new_columns.join(', '));
            } else {
                $('#new_columns_value').text('None');
                $('#new_columns_input').attr('disabled', true);
            }

            // REMOVED COLUMNS
            if (self.comparisons.removed_columns.length > 0) {
                $('#removed_columns_value').text(self.comparisons.removed_columns.join(', '));

                // check if the removed columns are currently plotted and show a warning
                if (self.comparisons.removed_columns_plotted) {
                    $('#removed_columns_value').closest('tbody').append($('<tr>').append($('<td>', {
                            colspan: '3',
                            style: 'background-color: white; padding-left: 0px; border: 0;'
                        }).append($('<div>', {
                                    class: 'alert alert-warning',
                                    role: 'alert',
                                    html: '<strong>Warning!</strong> Remove the columns from the layout first in order to remove them from the DataFrame.'
                                })
                            )
                        )
                    );
                    $('#removed_columns_input').attr('disabled', true);

                }
            } else {
                $('#removed_columns_value').text('None');
                $('#removed_columns_input').attr('disabled', true);
            }

            // NEW ROWS
            if (self.comparisons.new_rows != 0) {
                $('#new_rows_value').text(self.comparisons.new_rows);
            } else {
                $('#new_rows_value').text('None');
                $('#new_rows_input').attr('disabled', true);
            }

            // REMOVED ROWS
            if (self.comparisons.removed_rows != 0) {
                $('#removed_rows_value').text(self.comparisons.removed_rows);
            } else {
                $('#removed_rows_value').text('None');
                $('#removed_rows_input').attr('disabled', true);
            }

            // MODIFIED VALUES
            if (self.comparisons.different_values_number != 0) {
                $('#different_values_number').text('0 / ' + self.comparisons.different_values_number);
            } else {
                $('#different_values_number').text('None');
                $('#different_values_number_input').attr('disabled', true);
                $('#update_values_by_station').remove();
            }
        } else {
            $('div.modal-body').text('No changes have been found');
            $('#modal_accept_all_changes').addClass('hidden');
            $('#modal_accept_selected_changes').addClass('hidden');
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
