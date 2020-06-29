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

const shell = require('electron').shell;

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    init: function() {
        var self = this;
        self.available_computed_param =  $('select[name=available_computed_param]');
        self.added_computed_param = $('select[name=added_computed_param]');
        var url = path.join(loc.modals, 'add_computed_parameter_expression.html');
        tools.load_modal(url, () => {
            self.current_column_params_list = $('select[name=current_column_params]');
            self.all_computed_params_list = $('select[name=all_computed_param]');
            self.equation_text = $('textarea[name=equation]');
            self.units = $('input[name=units]');
            self.precision = $('select[name=precision]');

            for (var i = 0; i < 16; i += 1) {
                self.precision.append($('<option>', {
                    value: i,
                    text: i
                }))
            }

            self.precision.val(5);
            self.comp_param_name = $('input[name=expr_name]');
            self.current_columns = [];
            self.current_cp_cols = []

            $('#save_expr').prop('disabled', true);

            self.load_data();
        });
    },

    load_data: function() {
        var self = this;
        lg.info('-- LOAD DATA');
        var params = {
            'object': 'computed.parameter',
            'method': 'get_all_parameters'
        }
        tools.call_promise(params).then((result) => {
            if (typeof(result['columns']) !== 'undefined') {
                self.current_columns = result['columns'];
            }
            if (typeof(result['computed']) !== 'undefined') {
                self.current_cp_cols = result['computed'];
            }

            self.current_columns.forEach(function (column) {
                self.current_column_params_list.append($('<option>', {
                    value: column,
                    text : column
                }));
            });
            self.sort_select_list(self.current_column_params_list);

            var custom_cps = data.get('computed_params', loc.custom_settings);
            var proj_cps = data.get('computed_params', loc.proj_settings);
            proj_cps.forEach(function (column) {
                self.all_computed_params_list.append($('<option>', {
                    value: column.param_name,
                    text : column.param_name,
                    class: self.get_default_class(custom_cps, column),
                }));

                if (typeof(result['dependencies']) !== 'undefined') {
                    var dep = result['dependencies'];
                    if (!$.isEmptyObject(dep) && dep != null) {
                        self.all_computed_params_list.find('option').each(function() {
                            if ($(this).val() in dep) {
                                if (dep[$(this).val()] === false) {
                                    if ($(this).hasClass('default_param')) {
                                        $(this).removeClass('default_param');
                                    }
                                    $(this).addClass('missing_param');
                                }
                            }
                        })
                    }
                }
            });
            self.sort_select_list(self.all_computed_params_list);
            self.events();
        });
    },

    events: function() {
        var self = this;

        self.comp_param_name.tooltip({
            title: 'Allowed characters: a-z, A-Z, _',
            placement: 'bottom',
            trigger: 'manual',
            template: '<div class="tooltip tooltip-error" role="tooltip"><div class="arrow"></div><div class="tooltip-inner">Jamon</div></div>',
        });

        self.current_column_params_list.dblclick(() => {
            var value = ' ' + self.current_column_params_list.find('option:selected').val() + ' ';
            var cur_pos = self.equation_text.prop("selectionStart");
            var a = self.equation_text.val();
            var new_text_val = [a.slice(0, cur_pos), value, a.slice(cur_pos)].join('');
            new_text_val = new_text_val.replace(/  +/g, ' ');       // to avoid double spaces
            self.equation_text.val(new_text_val);
            self.equation_text.focus();
        });

        self.all_computed_params_list.dblclick(() => {
            var value = ' ${' + self.all_computed_params_list.find('option:selected').val() + '} ';
            var cur_pos = self.equation_text.prop("selectionStart");
            var a = self.equation_text.val();
            var new_text_val = [a.slice(0, cur_pos), value, a.slice(cur_pos)].join('');
            new_text_val = new_text_val.replace(/  +/g, ' ');
            self.equation_text.val(new_text_val);
            self.equation_text.focus();
        });

        self.all_computed_params_list.click(() => {
            var selected_opt = self.all_computed_params_list.find('option:selected')
            if (selected_opt.hasClass('default_param')) {
                $('#add_default_param').attr('hidden', '');
                $('#del_comp_param').attr('hidden', '');
                $('#set_non_default_param').removeAttr('hidden');
            }
            if (selected_opt.hasClass('missing_param')) {
                $('#add_default_param').attr('hidden', '');
                $('#del_comp_param').removeAttr('hidden');
                $('#set_non_default_param').attr('hidden', '');
            }
            if (!selected_opt.hasClass('missing_param') && !selected_opt.hasClass('default_param')) {
                $('#add_default_param').removeAttr('hidden');
                $('#del_comp_param').removeAttr('hidden');
                $('#set_non_default_param').attr('hidden', '');
            }
        });

        self.all_computed_params_list.mouseup((key) => {
            if (key.which == 1 && key.ctrlKey) {            // Ctrl + Mouse up (left button)

                // Fill the fields in order to edit the computed parameter
                var value = self.all_computed_params_list.val();
                var proj_cps = data.get('computed_params', loc.proj_settings);
                proj_cps.every(function (elem, index){
                    if ('param_name' in elem && elem['param_name'] == value) {
                        if (elem['units'] === false) {
                            self.units.val('');
                        } else{
                            self.units.val(elem['units']);
                        }
                        self.precision.val(elem['precision']);
                        self.comp_param_name.val(value);
                        self.comp_param_name.trigger('change');
                        self.equation_text.val(elem['equation']);
                        return false;           // to stop the every statement
                    }
                    return true;                // continue every statement
                })

                var selected_opt = self.all_computed_params_list.find('option:selected')
                if (selected_opt.hasClass('default_param')) {
                    $('#add_default_param').attr('hidden', '');
                    $('#del_comp_param').attr('hidden', '');
                    $('#set_non_default_param').removeAttr('hidden');
                }
                if (selected_opt.hasClass('missing_param')) {
                    $('#add_default_param').removeAttr('hidden');
                    $('#del_comp_param').attr('hidden', '');
                    $('#set_non_default_param').removeAttr('hidden');
                }
                if (!selected_opt.hasClass('missing_param') && !selected_opt.hasClass('default_param')) {
                    $('#add_default_param').removeAttr('hidden');
                    $('#del_comp_param').removeAttr('hidden');
                    $('#set_non_default_param').attr('hidden', '');
                }
            }
        });

        $('#save_expr').click(() => {
            var self = this;
            var expr_name = self.comp_param_name.val();
            var res = self.validate_expr_name(expr_name);
            if (res !== true) {
                $('input[name="expr_name"]').css('border-color', '#721c24');
                $('input[name="expr_name"]').css('box-shadow', '0 0 0 0.2rem #f8d7da');
                self.comp_param_name.attr('data-original-title', res);
                self.comp_param_name.tooltip('show');
                return;
            }

            var cps = self.all_computed_params_list.find('option').map(function() {
                return $(this).val();
            }).get();
            if (cps.includes(expr_name)) {
                tools.modal_question({
                    'title': 'Overwrite this parameter?',
                    'msg': 'A computer parameter already exists with that name. Would you like to overwrite it?' +
                           ' If it is a default computed parameter, it will be ovewritten as well.',
                    'callback_yes': self.compute_cp,
                    'self': self,        // callback argument >> TODO: try to do this better,
                                         // this is the cleanest way I found so far
                    'calback_no': false,
                });
                return;
            }
            self.compute_cp(self);
        });

        $('#del_comp_param').click(function() {
            lg.info('-- DEL COMP PARAM')
            var value = self.all_computed_params_list.val();

            // check if it is an added parameter
            var added_cps = self.added_computed_param.find('option').map(function() {
                return $(this).val();
            }).get();
            if (added_cps.includes(value)) {
                tools.showModal(
                    'WARNING',
                    'The column that you want to remove is added to the current project. ' +
                    'You must remove it from the project first'
                );
                return;
            }

            // update background list
            var update_list_behind = !self.all_computed_params_list.find('option[value="' + value + '"]').hasClass('missing_param');
            if (update_list_behind) {
                self.available_computed_param.find('option[value="' + value + '"]').remove();
            }

            var cps = data.get('computed_params', loc.proj_settings);
            cps.every(function (cp, index) {
                if ('param_name' in cp && cp['param_name'] == value) {
                    cps.splice(index, 1);
                    return false;
                }
                return true;
            });
            data.set({'computed_params': cps }, loc.proj_settings);

            // remove from custom_settings.json if it is a default cp
            var custom_cps = data.get('computed_params', loc.custom_settings);
            var new_custom_cps = [];
            custom_cps.forEach(function(cp) {
                if ('param_name' in cp && cp['param_name'] != value) {
                    new_custom_cps.push(cp);
                }
            });
            data.set({'computed_params': new_custom_cps }, loc.custom_settings);

            self.all_computed_params_list.find('option:selected').remove();
            if (self.all_computed_params_list.find('option').length > 0) {
                lg.info('-- CLICKING ON THE FIRST ELEMENT');
                self.all_computed_params_list.val(self.all_computed_params_list.find('option:eq(0)').val());
                self.all_computed_params_list.find('option:eq(0)').click();
            }

        });

        $('#set_non_default_param').click(function() {
            var value = self.all_computed_params_list.val();
            var current_cps = data.get('computed_params',loc.proj_settings);
            current_cps.every(function(current_cp, index) {
                if ('param_name' in current_cp && current_cp['param_name'] == value) {
                    var default_cp = data.get('computed_params', loc.custom_settings);
                    default_cp.splice(index, 1);
                    data.set({'computed_params': default_cp }, loc.custom_settings);
                    self.all_computed_params_list.find('option:selected').removeClass('default_param');
                    $('#set_non_default_param').attr('hidden', '');
                    $('#del_comp_param').removeAttr('hidden');
                    $('#add_default_param').removeAttr('hidden');
                    return false;
                }
                return true;
            });
        });

        $('#add_default_param').click(function() {
            var value = self.all_computed_params_list.val();
            var current_cps = data.get('computed_params',loc.proj_settings);
            if (typeof(value) !== 'undefined') {
                current_cps.every(function(current_cp, index) {
                    if ('param_name' in current_cp && current_cp['param_name'] == value) {
                        var default_cp = data.get('computed_params', loc.custom_settings);
                        default_cp.push(current_cp);
                        data.set({'computed_params': default_cp }, loc.custom_settings);
                        self.all_computed_params_list.find('option:selected').addClass('default_param');
                        $('#set_non_default_param').removeAttr('hidden');
                        $('#del_comp_param').attr('hidden', '');
                        $('#add_default_param').attr('hidden', '');
                        return false;
                    }
                    return true;
                })
            } else {
                tools.showModal('ERROR', 'Select one parameter add it to the default computed parameters');
            }
        });

        $('#reset_defaults').click(() => {
            tools.show_wait_cursor();
            var params = {
                'object': 'computed.parameter',
                'method': 'check_dependencies',
            }
            tools.call_promise(params).then((result) => {
                var default_cp = data.get('computed_params', loc.default_settings);
                data.set({'computed_params': default_cp }, loc.custom_settings);
                data.set({'computed_params': default_cp }, loc.proj_settings);
                var custom_cps = data.get('computed_params', loc.custom_settings);  // TODO: is this needed?

                self.all_computed_params_list.text('');
                default_cp.forEach(function (column) {
                    self.all_computed_params_list.append($('<option>', {
                        value: column.param_name,
                        text: column.param_name,
                        class: self.get_default_class(custom_cps, column)
                    }));
                });
                self.sort_select_list(self.all_computed_params_list);

                self.available_computed_param.text('');
                default_cp.forEach(function (column) {
                    if (!self.current_cp_cols.includes(column.param_name)) {
                        self.available_computed_param.append($('<option>', {
                            value: column.param_name,
                            text: column.param_name,
                        }));
                    }
                });
                self.sort_select_list(self.available_computed_param);

                if (!$.isEmptyObject(result) && result != null) {
                    self.all_computed_params_list.find('option').each(function() {
                        if ($(this).val() in result) {
                            if (result[$(this).val()] === false) {
                                if ($(this).hasClass('default_param')) {
                                    $(this).removeClass('default_param');
                                }
                                $(this).addClass('missing_param');
                                self.available_computed_param.find('option[value="' + $(this).val() + '"]').remove();
                            }
                        }
                    })
                }
                tools.show_default_cursor();
                tools.show_snackbar('Reset values completed!');
            });
        });

        $('#help_expression').click(() => {
            var url = path.join(loc.modals, 'add_computed_parameter_expression_help.html');
            tools.load_modal(url,() => {
                $('#modal_trigger_add_computed_parameter_help').click();
            });
        });

        self.comp_param_name.on('keyup change', () => {
            self.comp_param_name.tooltip('hide');
            $('input[name="expr_name"]').css('border-color', '');
            $('input[name="expr_name"]').css('box-shadow', '');

            var new_value = self.comp_param_name.val();
            if (new_value == '') {
                $('#save_expr').prop('disabled', true);
            } else {
                $('#save_expr').prop('disabled', false);
            }
        });

        $('#modal_trigger_add_computed_parameter_expression').click();
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

    get_default_class: function(cps, column) {
        var self = this;
        var is_default = false;
        cps.every(function (elem, index){
            if ('param_name' in elem && elem['param_name'] == column.param_name) {
                is_default = true;
                return false;           // stop every
            }
            return true;                // continue every statement
        });
        if (is_default == true && !self.current_columns.includes(column.param_name)) {
            return 'default_param';
        } else if(self.current_columns.includes(column.param_name)) {
            return 'missing_param';
        } else {
            return '';
        }
    },

    validate_expr_name: function(expr_name) {
        var self = this;
        var match = expr_name.match(/[0-9a-zA-Z_]+/);  // return a list of coincidences, null if there is no coincidence
        if (match == null || match[0] != expr_name) {
            return 'Write a valid expression name. ([a-zA-Z0-9_]+)';
        } else if (expr_name == 'AUX') {
            return 'AUX cannot be used as expression name';
        } else if (expr_name.indexOf('_FLAG_') !== -1) {
            return 'The string _FLAG_ cannot be used in the expression name, ' +
                   'it is reserved for flag columns';
        } else if (self.current_columns.includes(expr_name)) {
            return 'A column name that already exists cannot be used ' +
                   'in the expression name for a computed parameter';
        }
        return true
    },

    compute_cp: function(self=false) {
        lg.info('-- COMPUTE CP');
        if (self === false) {
            var self = this;
        }
        var expr_name = self.comp_param_name.val();
        var params = {
            'object': 'computed.parameter',
            'method': 'compute_equation',
            'args': {
                'computed_param_name': expr_name,
                'eq': self.equation_text.val(),
            }
        }
        tools.call_promise(params).then((result) => {
            lg.info('>> VALIDATE EQUATION RESULT: ' + JSON.stringify(result, null, 4));
            if ('success' in result && result['success'] == true) {
                self.update_computed_params(expr_name);
                self.all_computed_params_list.val(self.comp_param_name.val());
                var option = self.all_computed_params_list.find('option[value="' + self.comp_param_name.val() + '"]')
                if (!self.current_columns.includes(self.comp_param_name.val())) {  // do not change color if the column already exists
                    if (option.hasClass('missing_param')) {   // there were missing values, if "success" is true there won´t be missing values anymore
                        option.removeClass('missing_param');
                        option.addClass('default_param');
                    }
                }
                self.comp_param_name.val('');
                self.equation_text.val('');
                self.units.val('');
                self.precision.val(5);
                self.all_computed_params_list.focus();
                self.all_computed_params_list.val(expr_name);
                self.all_computed_params_list.click();
            } else if (result != null) {
                if ('msg' in result && 'success' in result && result['success'] === false) {
                    tools.showModal('ERROR', result.msg, 'Validation Error', false, result.error);
                }
            }
        });
    },

    update_computed_params: function(expr_name) {
        var self = this;
        var new_cp = true;
        var cps = self.all_computed_params_list.find('option').map(function() {
            return $(this).val();
        }).get();
        if (cps.includes(expr_name)) {
            new_cp = false;
        }

        // update settings.json
        var comp_params = data.get('computed_params', loc.proj_settings); // computed_params is a list of dictionaries
        var custom_cps = data.get('computed_params', loc.custom_settings);

        var units = self.units.val();
        if (units == '') units = false;
        if (new_cp) {
            comp_params.push({
                param_name: self.comp_param_name.val(),
                equation: self.equation_text.val(),
                units: units,
                precision: parseInt(self.precision.val())
            })
        } else {
            comp_params = jQuery.map(comp_params, function(cp) {
                if (typeof(cp.param_name) !== 'undefined' && cp.param_name == expr_name) {
                    return {
                        param_name: self.comp_param_name.val(),
                        equation: self.equation_text.val(),
                        units: units,
                        precision: parseInt(self.precision.val())
                    }
                } else {
                    return cp
                }
            });

            // check if it is by default and update the custom_settings
            custom_cps.forEach(function(cp) {
                if ('param_name' in cp && cp['param_name'] == expr_name) {
                    cp['equation'] = self.equation_text.val();
                    cp['units'] = units;
                    cp['precision'] = parseInt(self.precision.val());
                }
            });
            data.set({'computed_params': custom_cps }, loc.custom_settings);
        }
        data.set({'computed_params': comp_params }, loc.proj_settings);

        if (new_cp) {
            self.all_computed_params_list.append($('<option>', {
                value: self.comp_param_name.val(),
                text: self.comp_param_name.val()
            }));
            self.sort_select_list(self.all_computed_params_list);

            // update the list behind
            self.available_computed_param.append($('<option>', {
                value: self.comp_param_name.val(),
                text: self.comp_param_name.val()
            }));
            self.sort_select_list(self.available_computed_param);
        }
    },
}