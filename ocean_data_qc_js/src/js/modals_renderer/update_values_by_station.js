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
const data = require('data');
const tools = require('tools');

module.exports = {
    init: function(){
        var self = this;
        $('#update_values_by_station').on('click', function() {
            var url = path.join(loc.modals, 'update_values_by_station.html');
            tools.load_modal(url, function() {
                $('#modal_accept_selected_changes').click(function() {
                    var nb_changed_values = 0;
                    Object.keys(self.diff_values).forEach(function(param) {
                        Object.keys(self.diff_values[param]).forEach(function(stt) {
                            self.diff_values[param][stt].forEach(function(values) {
                                if (values.param_checked && (values.changed == 'param' || values.changed == 'both')) {
                                    nb_changed_values++;
                                }
                                if (values.flag_checked && (values.changed == 'flag' || values.changed == 'both')) {
                                    nb_changed_values++;
                                }
                            });
                        });
                    });
                    // change the value in the parent modal
                    var comparisons = $('body').data('comparisons');
                    $('#diff_val_qty').text(nb_changed_values + ' / ' + comparisons.diff_val_qty);

                    if (nb_changed_values < comparisons.diff_val_qty) {
                        $('input[name=diff_val_qty]').prop('checked', false);
                    } else {
                        $('input[name=diff_val_qty]').prop('checked', true);
                    }
                });

                $('#modal_accept_all_changes').click(function() {
                    var nb_changed_values = 0;
                    Object.keys(self.diff_values).forEach(function(param) {
                        Object.keys(self.diff_values[param]).forEach(function(stt) {
                            self.diff_values[param][stt].forEach(function(values) {
                                self.diff_values[param][stt].param_checked = true;
                                self.diff_values[param][stt].flag_checked = true;
                                if (values.changed == 'param' || values.changed == 'both') {
                                    nb_changed_values++;
                                }
                                if (values.changed == 'flag' || values.changed == 'both') {
                                    nb_changed_values++;
                                }
                            });
                        });
                    });
                    // change the value in the parent modal
                    var values_nb = $('body').data('comparisons').diff_val_qty;
                    $('#diff_val_qty').text(nb_changed_values + ' / ' + values_nb);

                    $('input[name=diff_val_qty]').prop('checked', true);
                });

                var params = {
                    'object': 'cruise.data.handler',
                    'method': 'get_different_values'
                }
                tools.call_promise(params).then((result) => {
                    lg.info('-- RESULTS');
                    lg.info(JSON.stringify(result, null, 4))
                    if (typeof(result['diff_values']) !== 'undefined') {
                        self.set_diff_values(result.diff_values);
                    }
                });

            });
        });
    },

    set_diff_values: function(diff_values={}) {
        lg.info('-- SET DIFF VALUES')
        var self = this;
        lg.info('>> DIFF VALUES (stored as div data variable): ' + JSON.stringify($('body').data('diff_values'), null, 4));
        self.diff_values = false;
        if (typeof($('body').data('diff_values')) === 'undefined') {
            diff_values = JSON.parse(diff_values);
            lg.info('~~ INITIALIZE DIFF VALUES DATA')
            Object.keys(diff_values).forEach(function(param) {
                Object.keys(diff_values[param]).forEach(function(stt) {
                    diff_values[param][stt].forEach(function(values) {
                        values['param_checked'] = true;
                        values['flag_checked'] = true;
                    });
                });
            });
            $('body').data('diff_values', diff_values);
            self.diff_values = diff_values;
        } else {
            lg.info('~~ LOAD DIFF VALUES DATA')
            self.diff_values = $('body').data('diff_values');
        }

        Object.keys(self.diff_values).forEach(function(param) {
            $('select[name=param_name]').append($('<option>', {
                value: param,
                text : param
            }));
        });

        $('select[name=param_name]').change(function () {
            self.param = $(this).val();
            $('body').data('selected_param', self.param);
            lg.info('>> SELECTED VALUE: ' + $(this).val());
            self.diff_values[self.param];
            if($('#accordion_stations').text() != '') {
                $('#accordion_stations').accordion('destroy');
                $('#accordion_stations').text('');
            }

            var check_box_id = 0;
            Object.keys(self.diff_values[self.param]).forEach(function(stt) {
                self.stt = stt;
                var stt_title = $('#stt_title').clone();
                stt_title.attr('id', 'stt_title-' + stt);
                stt_title.text('Station ' + stt);
                $('#accordion_stations').append(stt_title);

                var div_stt_table = $('#div_stt_table').clone();
                div_stt_table.attr('id', 'div_stt_table-' + stt);
                div_stt_table.find('th[name=param_name]').text(self.param);
                div_stt_table.find('th[name=flag_name]').text(self.param + '_FLAG_W');
                div_stt_table.find('#stt_param_check_all').attr('id', 'stt_param_check_all_' + stt)
                div_stt_table.find('label[for=stt_param_check_all]').attr('for', 'stt_param_check_all_' + stt)
                div_stt_table.find('#stt_flag_check_all').attr('id', 'stt_flag_check_all_' + stt)
                div_stt_table.find('label[for=stt_flag_check_all]').attr('for', 'stt_flag_check_all_' + stt)

                lg.info('>> DIFF VALUES PARAM STT: ' + JSON.stringify(self.diff_values[self.param][stt], null, 4));

                self.diff_values[self.param][stt].forEach(function(values) {
                    lg.info('>> VALUES: ' + JSON.stringify(values, null, 4));
                    lg.info('>> HASH_ID: ' + values.hash_id);
                    div_stt_table.find('tbody').append($('<tr>').attr('name', values.hash_id));
                    var tr = div_stt_table.find('tbody tr[name=' + values.hash_id + ']');
                    tr.append($('<td>', {text : values.castno }));
                    tr.append($('<td>', {text : values.btlnbr }));
                    tr.append($('<td>', {text : values.latitude }));
                    tr.append($('<td>', {text : values.longitude }));
                    if (typeof(values.old_param_value) !== 'undefined' && values.old_param_value !== false) {
                        tr.append($('<td>', { text : values.old_param_value }));
                    } else {
                        tr.append($('<td>', { text : 'NaN' }));
                    }

                    if (typeof(values.new_param_value) !== 'undefined' && values.new_param_value !== false) {
                        tr.append($('<td>', { text : values.new_param_value }));
                    } else {
                        tr.append($('<td>', { text : 'NaN' }));
                    }
                    var param_disabled = false;
                    if (values.changed == 'param' || values.changed == 'both') {
                        param_disabled = false;
                    } else {
                        param_disabled = true;
                    }

                    var param_check_div = $('<div>', {
                        class: 'form-check abc-checkbox abc-checkbox-primary',
                    });
                    param_check_div.append(
                        $('<input>', {
                            id: 'param_check_' + check_box_id,
                            class: 'form-check-input',
                            type: 'checkbox',
                            name: 'param_check',
                            checked: values.param_checked,
                            disabled: param_disabled
                        }).click(self.checkbox_click_row)
                    );
                    param_check_div.append(
                        $('<label>', {
                            for: 'param_check_' + check_box_id,
                            class: 'form-check-label',
                        })
                    );
                    tr.append($('<td>').append(param_check_div));

                    if (typeof(values.old_flag_value) !== 'undefined' && values.old_flag_value !== false) {       // NaN values
                        tr.append($('<td>', { text : values.old_flag_value }));
                    } else {
                        tr.append($('<td>', { text : 'NaN' }));
                    }
                    if (typeof(values.new_flag_value) !== 'undefined' && values.old_flag_value !== false) {       // NaN values
                        tr.append($('<td>', { text : values.new_flag_value }));
                    } else {
                        tr.append($('<td>', { text : 'NaN' }));
                    }

                    var flag_disabled = false;
                    if (values.changed == 'flag' || values.changed == 'both') {
                        flag_disabled = false;
                    } else {
                        flag_disabled = true;
                    }
                    var flag_check_div = $('<div>', {
                        class: 'form-check abc-checkbox abc-checkbox-primary',
                    });
                    flag_check_div.append(
                        $('<input>', {
                            id: 'flag_check_' + check_box_id,
                            class: 'form-check-input',
                            type: 'checkbox',
                            name: 'flag_check',
                            checked: values.flag_checked,
                            disabled: flag_disabled
                        }).click(self.checkbox_click_row)
                    );
                    flag_check_div.append(
                        $('<label>', {
                            for: 'flag_check_' + check_box_id,
                            class: 'form-check-label',
                        })
                    );
                    tr.append($('<td>').append(flag_check_div));

                    check_box_id++;
                });
                div_stt_table.find('input[name=stt_param_check_all]').click(self.checkbox_click_all);
                div_stt_table.find('input[name=stt_flag_check_all]').click(self.checkbox_click_all);

                // check if a column is completely disabled
                var param_disabled_all = true;
                div_stt_table.find('tbody input[name=param_check]').each(function() {
                    if (typeof($(this).attr('disabled')) === 'undefined') {
                        param_disabled_all = false;
                        return;
                    }
                })
                if (param_disabled_all == true) {
                    div_stt_table.find('input[name=stt_param_check_all]').attr('disabled', true);
                }

                var flag_disabled_all = true;
                div_stt_table.find('tbody input[name=flag_check]').each(function() {
                    if (typeof($(this).attr('disabled')) === 'undefined') {
                        flag_disabled_all = false;
                        return;
                    }
                })
                if (flag_disabled_all == true) {
                    div_stt_table.find('input[name=stt_flag_check_all]').attr('disabled', true);
                }

                // execute only run the function handler without changing the checkbox state
                div_stt_table.find('tbody input[name=param_check]').first().triggerHandler('click');
                div_stt_table.find('tbody input[name=flag_check]').first().triggerHandler('click');
                $('#accordion_stations').append(div_stt_table);
            });

            $('#accordion_stations').accordion({
                collapsible: true,
                heightStyle: 'content',
            });
        });

        $('select[name=param_name]').trigger('change');
        $('#modal_trigger_update_values_by_station').click();
    },

    checkbox_click_row: function() {
        var param = $('body').data('selected_param');
        var diff_values = $('body').data('diff_values');
        var div_accordion = $(this).closest('.accordion_station');
        var station = div_accordion.attr('id').split('-')[1];

        var check_value_attr = '';
        var check_all = '';
        if ($(this).attr('name') == 'param_check') {
            check_value_attr = 'param_checked';
            check_all = 'stt_param_check_all';
        } else {
            check_value_attr = 'flag_checked';
            check_all = 'stt_flag_check_all';
        }

        // check if all the checkboxes are clicked
        var all_checked = true;
        div_accordion.find('tbody input[name=' + $(this).attr('name') + ']').each(function() {
            if (!$(this).is(':checked')) {
                all_checked = false;
            }
        });
        if (all_checked) {
            div_accordion.find('input[name=' + check_all + ']').prop('checked', true);
        } else {
            div_accordion.find('input[name=' + check_all + ']').prop('checked', false);
        }

        if ($(this).is(":checked")) {
            diff_values[param][station][$(this).closest('tr').index()][check_value_attr] = true;
        } else {
            diff_values[param][station][$(this).closest('tr').index()][check_value_attr] = false;
        }
        $('#diff_values').data('diff_values', diff_values);
    },

    checkbox_click_all: function() {
        var param = $('body').data('selected_param');
        var diff_values = $('body').data('diff_values');
        lg.info('-- STATION CHECKBOX ALL CLICK');
        var div_accordion = $(this).closest('.accordion_station');
        var station = div_accordion.attr('id').split('-')[1];

        var check_name = '';
        var check_value_attr = '';
        if ($(this).attr('name') == 'stt_param_check_all') {
            check_name = 'param_check';
            check_value_attr = 'param_checked';
        } else {
            check_name = 'flag_check';
            check_value_attr = 'flag_checked';
        }

        if ($(this).is(":checked")) {
            div_accordion.find('tbody input[name=' + check_name + ']').filter(function() {
                return typeof($(this).attr('disabled')) === 'undefined'
            }).prop('checked', true);
            diff_values[param][station].forEach(function(values) {
                values[check_value_attr] = true;
            });
        } else {
            div_accordion.find('tbody input[name=' + check_name + ']').filter(function() {
                return typeof($(this).attr('disabled')) === 'undefined'
            }).prop('checked', false);
            diff_values[param][station].forEach(function(values) {
                values[check_value_attr] = false;
            });
        }
        $('#diff_values').data('diff_values', diff_values);
    }
}