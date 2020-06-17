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

require('datatables.net-bs4')(window, $);
require('datatables.net-colreorder-bs4')(window, $);
require('datatables.net-fixedheader-bs4')(window, $);

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    load: function() {
        lg.info('-- LOAD DATA COL SETTINGS')
        var self = this;

        self.tmp_record = {}
        self.pageScrollPos = null;
        self.cs_cols = data.get('columns', loc.custom_settings);
        self.cps = data.get('computed_params', loc.custom_settings);
        self.update_col_lists();

        if (Object.keys(self.cs_cols).length > 1 && Object.keys(self.cs_cols).length > 1 ) {
            var url = path.join(loc.modals, 'column_app.html');
            tools.load_modal(url, function() {
                self.parse_data();
                self.set_add_col_bt();
            });
        } else {
            tools.show_modal({
                'msg_type': 'text',
                'type': 'ERROR',
                'msg': 'There are not columns or settings files could not be read.',
            });
        }
    },

    update_col_lists: function() {
        var self = this;
        self.cps_list = [];
        self.cps.forEach(function(elem) {
            self.cps_list.push(elem.param_name);
        });
        self.cs_cols_list = Object.keys(self.cs_cols);
    },

    parse_data: function() {
        var self = this;
        var cols = Object.keys(self.cs_cols);  // are they sorted?

        for (var i = 0; i < cols.length; i++) {
            var col_name = cols[i];
            var txt_col_name = self.get_txt_col_name(col_name);
            var txt_external_name = self.get_txt_external_name(col_name);
            var data_type = self.get_data_type(col_name);

            var basic_field = self.get_cb_field(i, col_name, 'basic');
            var required_field = self.get_cb_field(i, col_name, 'required');
            var non_qc_field = self.get_cb_field(i, col_name, 'non_qc');

            var sel_cur_prec = self.get_cur_prec(col_name, data_type);
            var txt_cur_unit = self.get_txt_cur_unit(col_name);
            var bt_edit = self.get_edit_bt();
            var bt_rmv = self.get_rmv_bt();
            var bt_valid = self.get_valid_bt();
            var bt_discard = self.get_discard_bt();

            var tr = $('<tr>');
            tr.append(
                $('<td>', {html: txt_col_name }),
                $('<td>', {html: txt_external_name }),
                $('<td>', {html: data_type }),

                $('<td>', {html: basic_field }),
                $('<td>', {html: required_field }),
                $('<td>', {html: non_qc_field }),

                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
                $('<td>', {html: [bt_edit, bt_rmv, bt_valid, bt_discard] }),
            );

            $('#table_column_app tbody').append(tr);

        }
        $('[data-toggle="tooltip"]').tooltip();

        $('#column_app_win').on('shown.bs.modal', function (e) {
            self.data_table = $('#table_column_app').DataTable({  // TODO: show only when rendered
                scrollY: 400,
                scrollCollapse: true,
                paging: false,
                searching: true,
                ordering: true,
                order: [[ 0, 'asc' ]],  // this is the value by default
                info: false,
                columnDefs: [
                    { targets: '_all', visible: true, },
                    { targets: [5], orderable: false, searchable: false, },
                ],
                initComplete: function () {
                    $('#div_column_app').animate({ opacity: 1, }, { duration: 100, });
                    tools.set_tags_input();
                    tools.disable_tags_input();
                },

                // to keep the scroll position after draw() method
                preDrawCallback: function (settings) {
                    self.pageScrollPos = $('#div_column_app div.dataTables_scrollBody').scrollTop();
                },
                drawCallback: function (settings) {
                    $('#div_column_app div.dataTables_scrollBody').scrollTop(self.pageScrollPos);
                }
            });

            $('#table_column_app_filter input[type="search"]').off().on('keyup', function() {
                // This disables the Datatables event handler for the default search input and creates its own below.
                // It uses draw() to draw the table which will invoke the search plugins.
                $('#table_column_app').DataTable().draw();
            });

            $.fn.dataTable.ext.search.push(
                function(settings, searchData, index, rowData, rowIndex ) {
                    if ( settings.nTable.id === 'table_column_app' ) {
                        // there has to be a better way to get the current search value
                        var s = $('#table_column_app_filter input[type="search"]').val().toUpperCase();

                        // var res = self.search_in_tags(index, s);

                        // rowData is an array with the original cell contents as strings
                        var col_name = $(rowData[0]).val();  // column 0

                        if (col_name.includes(s)) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            );
        });
        $('#modal_column_app').click();
    },

    search_in_tags: function(index, s) {
        // TODO: it seems that sometimes the index start in 0, other times in 1 and does not work well
        var self = this;
        if (s.lenth == 1) {
            var row = $('#table_column_app>tbody tr').slice(index, index + 1);
        } else {
            var row = $('#table_column_app>tbody tr').slice(index - 1, index);
        }
        var tags = row.find('input[name="txt_external_name"]').tagsinput('items');

        if (typeof(tags) !== 'undefined' && tags != []) {
            var found = false;
            tags.forEach(function(t) {
                if (t.includes(s)) {
                    lg.warn('>> INDEX: ' + index + ' | S: ' + s + ' | TAGS: ' + JSON.stringify(tags));
                    found = true;
                }
            });
            if (found === true) {
                return true;
            }
        }
        return false;
    },

    get_txt_col_name: function(col_name=false) {
        var self = this;
        var input = $('<input>', {
            name: 'txt_col_name',
            class: 'form-control form-control-sm',
            type: 'text',
            value: col_name === false ? '' : col_name,
            disabled: true
        });

        input.on('change', function() {
            // Update the current value of the field and reload the table "data"
            // to make work the search again
            $(this).val($(this).val().toUpperCase());  // does it work?
            $(this).attr('value', $(this).val());
            var td = $(this).parent('td');
            $('#table_column_app').DataTable().cell(td).data(td.html());
        });
        return input;
    },

    get_txt_external_name: function(col_name=false) {
        var self = this;
        var external_name = [];
        if (col_name !== false) {
            external_name = self.cs_cols[col_name]['external_name'];
        }
        var tags_input = external_name.join(',');
        return $('<input>', {
            'name': 'txt_external_name',
            'class': 'form-control form-control-sm',
            'type': 'text',
            'data-role': 'tagsinput',
            'value': tags_input,
            'disabled': true
        });
    },

    get_data_type: function(col_name=false) {
        var self = this;
        var tmp_data_type = '';
        if (col_name !== false) {
            var tmp_data_type = self.cs_cols[col_name]['data_type'];
        }

        var sel_cur_data_type = $('<select>', {
            class: 'form-control form-control-sm',
            name: 'sel_cur_data_type',
            disabled: true
        })
        var opts = [
            'none',  // in case the user does not know the data type of the column or it can be more than one
            'integer',
            'float',
            'string',
            // 'date'   // include this type, or treat them as strings?
        ]
        opts.forEach(function(o) {
            var opt = $('<option>', {
                value: o,
                text: o
            });
            if (o === 'none' && (tmp_data_type === '' || tmp_data_type === false)) {
                opt.attr("selected","selected");
            }
            if (tmp_data_type === o) {
                opt.attr("selected","selected");
            }
            sel_cur_data_type.append(opt);
        });
        self.sel_data_type_change(sel_cur_data_type);
        return sel_cur_data_type;
    },

    get_cb_field: function(row=false, col_name=false, type=false) {  // if col_name = fals >> new row
        var self = this;
        if (type !== false) {
            var attrs = [];
            if (col_name !== false) {
                var attrs = self.cs_cols[col_name]['attrs'];
            }
            var checked = false;
            if (attrs.length > 0 && attrs.includes(type)) {
                checked = true;
            }
            var cb_export = $('<div>', {
                class: 'form-check abc-checkbox abc-checkbox-primary'
            }).append(
                $('<input>', {
                    id: 'cb_' + type + '_row_' + row,
                    class: 'form-check-input',
                    name: 'cb_' + type,
                    type: 'checkbox',
                    checked: checked,
                    disabled: true,
                })
            ).append(
                $('<label>', {
                    for: 'cb_' + type + '_row_' + row,
                    class: 'form-check-label'
                })
            );
            return cb_export
        }
    },

    sel_data_type_change: function(sel_cur_data_type) {
        var self = this;
        sel_cur_data_type.on('change', function() {
            // none > precision 'none' disabled
            // integer > precision 0 disabled
            // string > precision 'none' disabled
            // float > precision 1 enabled
            var sel_val = $(this).val();
            var prec_obj = $(this).parent().parent().find('select[name="sel_cur_prec"]');
            if (sel_val === 'none' || sel_val === 'string') {
                prec_obj.val('none');
                prec_obj.attr('disabled', true);
            } else if (sel_val == 'integer') {
                prec_obj.val('0');
                prec_obj.attr('disabled', true);
            } else if (sel_val == 'float') {
                prec_obj.val('1')
                prec_obj.attr('disabled', false);
            }
        });
    },

    get_cur_prec: function(col_name=false, sel_cur_data_type=false) {
        var self = this;
        var tmp_prec = 'none';
        if (col_name !== false) {
            tmp_prec = self.cs_cols[col_name]['precision'];
        }
        var sel_cur_prec = $('<select>', {
            class: 'form-control form-control-sm',
            name: 'sel_cur_prec',
            disabled: true
        })
        sel_cur_prec.append($('<option>', {
            value: 'none',
            text: 'None',
        }))
        for (var j = 0; j < 16; j++) {
            var opt = $('<option>', {
                value: j,
                text: j
            });
            if (tmp_prec === j) {
                opt.attr("selected","selected");
                sel_cur_prec.attr('disabled', false);
            }
            sel_cur_prec.append(opt);
        }
        if ((tmp_prec === false || tmp_prec == 0) && sel_cur_data_type !== false) {
            if (sel_cur_data_type.val() == 'integer') {
                sel_cur_prec.attr('disabled', true);
                sel_cur_prec.val('0');
            }
            if (['string', 'none'].includes(sel_cur_data_type.val())) {
                sel_cur_prec.attr('disabled', true);
                sel_cur_prec.val('none');
            }
        }
        return sel_cur_prec
    },

    get_txt_cur_unit: function(col_name=false) {
        var self = this;
        var cur_unit = '';
        if (col_name !== false) {
            if (self.cs_cols[col_name]['unit'] !== false) {
                cur_unit = self.cs_cols[col_name]['unit'];
            }
        }
        var txt_cur_unit = $('<input>', {
            name: 'txt_cur_unit',
            class: 'form-control form-control-sm',
            type: 'text',
            value: cur_unit,
            disabled: true,
        });
        // TODO: ask if string fields can have units
        // if (self.cs_cols[col_name]['data_type'] === 'string') {
        //     txt_cur_unit.attr('disabled', true);
        // }
        return txt_cur_unit;
    },

    get_edit_bt: function() {
        var self = this;
        var bt = $('<button>', {
            class: 'edit_col btn btn-warning fa fa-pencil',
            type: 'button'
        });
        bt.on('click', function() {
            var tr = $(this).parents('tr');
            self.tmp_record = {
                bgcolor: tr.css('background-color'),  // move to some class
                col_name: tr.find('input[name="txt_col_name"]').val().toUpperCase(),
                external_name: tr.find('input[name="txt_external_name"]').tagsinput('items').slice(),  // slice() to make a copy by value
                data_type: tr.find('select[name="sel_cur_data_type"]').val(),
                basic: tr.find('input[name="cb_basic"]').prop('checked'),
                required: tr.find('input[name="cb_required"]').prop('checked'),
                non_qc: tr.find('input[name="cb_non_qc"]').prop('checked'),
                cur_prec: tr.find('select[name="sel_cur_prec"]').val(),
                cur_unit: tr.find('input[name="txt_cur_unit"]').val(),
            }
            tr.find('.discard_col, .valid_col').css('display', 'inline-block');
            tr.find('.rmv_col, .edit_col').css('display', 'none');
            tr.find('input, select').removeAttr('disabled');

            tr.addClass('edit_row');

            // TODO: enable precision only if data type = float

            tools.enable_tags_input(tr);
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').attr('disabled', true);
        });
        return bt;
    },

    get_rmv_bt: function() {
        var self = this;
        var bt = $('<button>', {
            class: 'rmv_col btn btn-danger fa fa-trash',
            type: 'button'
        });
        bt.on('click', function() {
            var tr = $(this).parents('tr');
            var col = tr.find('input[name="txt_col_name"]').val();

            if (self.check_col_in_cps(col) && self.check_col_in_tabs(col)) {
                tools.modal_question({
                    'title': 'Remove row?',
                    'msg': 'Are you sure you want to remove this row?',
                    'callback_yes': function() {
                        var data_table = $('#table_column_app').DataTable();  // get the obj reference if it is already crated
                        data_table.row(tr).remove().draw();
                        delete self.cs_cols[col];
                        data.set({'columns': self.cs_cols }, loc.custom_settings);
                        tools.show_snackbar('Column ' + col + ' removed');
                    },
                    'self': self
                });
            }
        });
        return bt;
    },

    check_col_in_cps: function(col=false) {
        var self = this;
        var cps = data.get('computed_params', loc.default_settings);
        var col_in_cps = [];
        cps.forEach(function(elem) {
            if (elem.equation.includes(col)) {
                col_in_cps.push(elem.param_name);
            }
        });
        if (col_in_cps.length == 0) {
            return true
        } else {
            tools.show_modal({
                msg_type: 'text',
                type: 'ERROR',
                msg: 'The column ' + col + ' is used in the following calculared parameters and cannot be removed or edited:',
                code: col_in_cps.join(', ')
            });
            return false;
        }
    },

    check_col_in_tabs: function(col=false) {
        var self = this;
        var tabs = data.get('qc_plot_tabs', loc.default_settings);
        var cols = []
        Object.keys(tabs).forEach(function(tab) {
            tabs[tab].forEach(function(g) {
                if (!cols.includes(g.x)) {
                    cols.push(g.x);
                }
                if (!cols.includes(g.y)) {
                    cols.push(g.y);
                }
            });
        });
        if (cols.includes(col)) {
            tools.show_modal({
                msg_type: 'text',
                type: 'ERROR',
                msg: 'The column ' + col + ' is used in one of the tabs plotted by default and cannot be removed'
            });
            return false;
        } else {
            return true;
        }

    },

    get_discard_bt: function() {
        var self = this;
        var bt = $('<button>', {
            class: 'discard_col btn btn-danger fa fa-times',
            type: 'button',
            style: 'display: none;'
        });
        bt.on('click', function() {
            var tr = $(this).parents('tr');
            if ($.isEmptyObject(self.tmp_record)) {
                // discard new_row
                var data_table = $('#table_column_app').DataTable();
                data_table.row(tr).remove().draw();
                return;
            }
            tr.find('input[name="txt_col_name"]').val(self.tmp_record.col_name);
            var ti = tr.find('input[name="txt_external_name"]');
            ti.tagsinput('removeAll');
            self.tmp_record.external_name.forEach(function(value) {
                ti.tagsinput('add', value);
            })

            tr.find('select[name="sel_cur_data_type"]').val(self.tmp_record.data_type);
            tr.find('input[name="cb_basic"]').prop('checked', self.tmp_record.basic);
            tr.find('input[name="cb_required"]').prop('checked', self.tmp_record.required);
            tr.find('input[name="cb_non_qc"]').prop('checked', self.tmp_record.non_qc);
            tr.find('select[name="sel_cur_prec"]').val(self.tmp_record.cur_prec);
            tr.find('input[name="txt_cur_unit"]').val(self.tmp_record.cur_unit);

            tr.find('.discard_col, .valid_col').css('display', 'none');
            tr.find('.rmv_col, .edit_col').css('display', 'inline-block');
            tr.find('input, select').attr('disabled', true);

            // tr.css('background-color', self.tmp_record.bgcolor);
            tr.removeClass('edit_row');

            tools.disable_tags_input();
            self.tmp_record = {};
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').removeAttr('disabled');
        });
        return bt;
    },

    set_add_col_bt: function() {
        var self = this;
        $('#add_column').on('click', function() {
            var data_table = $('#table_column_app').DataTable();

            var scroll_body = $(data_table.table().node()).parent();
            scroll_body.animate({ scrollTop: scroll_body.get(0).scrollHeight }, 500);

            var new_row_i = data_table.data().length;

            var txt_col_name = self.get_txt_col_name();
            var txt_external_name = self.get_txt_external_name();
            var data_type = self.get_data_type();

            var basic_field = self.get_cb_field(new_row_i, false, 'basic');
            var required_field = self.get_cb_field(new_row_i, false, 'required');
            var non_qc_field = self.get_cb_field(new_row_i, false, 'non_qc');

            var sel_cur_prec = self.get_cur_prec();
            var txt_cur_unit = self.get_txt_cur_unit();
            var bt_edit = self.get_edit_bt();
            var bt_rmv = self.get_rmv_bt();
            var bt_valid = self.get_valid_bt();
            var bt_discard = self.get_discard_bt();

            var tr = $('<tr>', {
                class: 'new_row'
            });
            tr.append(
                $('<td>', {html: txt_col_name }),
                $('<td>', {html: txt_external_name }),
                $('<td>', {html: data_type }),

                $('<td>', {html: basic_field }),
                $('<td>', {html: required_field }),
                $('<td>', {html: non_qc_field }),

                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
                $('<td>', {html: [bt_edit, bt_rmv, bt_valid, bt_discard] }),
            );
            data_table.row.add(tr).draw();
            tools.set_tags_input(tr);
            self.enable_row(tr)
            $(tr).find('input[name="txt_col_name"]').focus();
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').attr('disabled', true);
        });
    },

    get_valid_bt: function() {
        var self = this;

        var bt = $('<button>', {
            'class': 'valid_col btn btn-success fa fa-check',
            'type': 'button',
            'style': 'display: none;',
        });
        bt.tooltip();

        bt.on('click', function() {
            var tr = $(this).parents('tr');
            var table = $(this).parents('table');
            self.update_col_lists();

            if (self.check_valid_col_name(tr) === false) {
                return;
            }

            if (self.check_tagsinput(table, tr) === false) {
                return;
            }
            if (tr.hasClass('new_row')) {
                self.create_row(tr);
            } else {
                self.update_row(tr);
            }
            self.disable_row(tr);  // back to the new normal >> everything disabled

            $('#table_column_app').DataTable().draw();
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').removeAttr('disabled');
        });
        return bt
    },

    check_valid_col_name: function(tr=false) {
        var self = this;
        var col_name = tr.find('input[name="txt_col_name"]').val();
        if (col_name === '') {
            tools.show_modal( {
                msg_type: 'text',
                type: 'VALIDATION ERROR',
                msg: 'The column name field is empty.',
            })
            return false;
        }

        var re = new RegExp('[^A-Z0-9_]+', 'g');
        var l = col_name.split(re);
        if (l.length > 1) {
            tools.show_modal( {
                msg_type: 'text',
                type: 'VALIDATION ERROR',
                msg: 'The column name has some invalid characters. You can use: A-Z, 0-9, _',
            })
            return false;
        }

        // check if the name has changed
        if (tr.hasClass('new_row') || (tr.hasClass('edit_row') && self.tmp_record.col_name != col_name)){
            return self.check_dup_col(col_name);
        } else {
            return true; // edit_row and no changes
        }
    },

    check_dup_col: function(col=false) {
        var self = this;

        if (self.cs_cols_list.includes(col)) {
            tools.show_modal( {
                msg_type: 'text',
                type: 'VALIDATION ERROR',
                msg: 'The column ' + col + ' already exists.',
            })
            return false;
        } else if (self.cps_list.includes(col)) {
            tools.show_modal({
                msg_type: 'text',
                type: 'VALIDATION ERROR',
                msg: 'The column ' + col + ' is a calculated parameter name.' +
                        ' You need to use a different one',
            })
            return false;
        } else {
            return true;
        }
    },

    check_tagsinput: function(table=false, tr=false) {
        var self = this;
        var cur_tags = table.find('tr.edit_row, tr.new_row').find('input[name="txt_external_name"]').tagsinput('items');
        cur_tags = cur_tags.map(function(x){ return x.toUpperCase() })
        cur_tags.forEach(function(c) {
            var re = new RegExp('[^A-Z0-9_]+', 'g');
            var l = c.split(re);
            if (l.length > 1) {
                tools.show_modal( {
                    msg_type: 'text',
                    type: 'VALIDATION ERROR',
                    msg: 'The name in file "' + c + '" has some invalid characters. You can use: A-Z, 0-9, _',
                })
                return false;
            }
        });

        var rows = table.find('tr').not('.edit_row, .new_row');
        var other_tags = rows.find('input[name="txt_external_name"]').tagsinput('items');

        if (cur_tags.includes(tr.find('input[name="txt_col_name"]').val())) {
            tools.show_modal({
                'msg_type': 'text',
                'type': 'VALIDATION ERROR',
                'msg': 'The current row column name cannot be in the external names as well.',
            });
            return false;
        }

        var res = true;
        cur_tags.forEach(function(ct) {
            if (self.check_dup_col(ct) === false) {
                res = false;
            }
            other_tags.forEach(function(tl) {
                if (tl != []) {
                    tl.forEach(function(tg) {
                        if (ct == tg) {
                            tools.show_modal({
                                'msg_type': 'text',
                                'type': 'VALIDATION ERROR',
                                'msg': 'The external name ' + tg + ' is already in other parameter.',
                            });
                            res = false;
                        }
                    });
                }

            });
        });
        return res;
    },

    create_row: function(tr=false) {
        lg.info('-- CREATE ROW');
        var self = this;
        self.upd_row_values(tr);
        data.set({'columns': self.cs_cols}, loc.custom_settings);
    },

    update_row: function(tr=false) {
        lg.info('-- UPDATE ROW');
        var self = this;
        self.upd_row_values(tr);

        // if the name is different remove the previous one form the cs_cols object
        var new_col_name = tr.find('input[name="txt_col_name"]').val().toUpperCase();
        if (self.tmp_record.col_name != new_col_name) {
            delete self.cs_cols[self.tmp_record.col_name];
        }

        self.cps.forEach(function(elem) {
            var re = new RegExp('\\b' + self.tmp_record.col_name + '\\b', 'g');
            elem.equation = elem.equation.split(re).join(new_col_name);  // this updates self.cps
        });

        // TODO: order columns and params by key?

        data.set({'columns': self.cs_cols}, loc.custom_settings);
        data.set({'computed_params': self.cps}, loc.custom_settings);
    },

    upd_row_values: function(tr=false) {
        var self = this;
        var new_col_name = tr.find('input[name="txt_col_name"]').val().toUpperCase();

        var attrs = [];
        if (tr.find('input[name="cb_basic"]').prop('checked')) {
            attrs.push('basic');
        }
        if (tr.find('input[name="cb_required"]').prop('checked')) {
            attrs.push('required');
        }
        if (tr.find('input[name="cb_non_qc"]').prop('checked')) {
            attrs.push('non_qc');
        }

        var precision = false
        var data_type = tr.find('select[name="sel_cur_data_type"]').val();
        if (tr.find('select[name="sel_cur_prec"]').val() != 'none' && !['none', 'string'].includes(data_type)) {
            precision = parseInt(tr.find('select[name="sel_cur_prec"]').val());
        }

        var unit = false;
        if (tr.find('input[name="txt_cur_unit"]').val() != '') {
            unit = tr.find('input[name="txt_cur_unit"]').val()
        }

        var external_name = tr.find('input[name="txt_external_name"]').tagsinput('items').slice();
        if (external_name != []) {
            external_name = external_name.map(function(x){ return x.toUpperCase() })
        }

        self.cs_cols[new_col_name] = {
            external_name: external_name,
            data_type: tr.find('select[name="sel_cur_data_type"]').val(),
            attrs: attrs,
            unit: unit,
            precision: precision,
        }
    },

    disable_row: function(tr=false) {
        var self = this;
        tr.find('input[name="txt_col_name"]').attr('disabled', true);
        tr.find('select[name="sel_cur_data_type"]').attr('disabled', true);
        tr.find('input[name="cb_basic"]').attr('disabled', true);
        tr.find('input[name="cb_required"]').attr('disabled', true);
        tr.find('input[name="cb_non_qc"]').attr('disabled', true);
        tr.find('select[name="sel_cur_prec"]').attr('disabled', true);
        tr.find('input[name="txt_cur_unit"]').attr('disabled', true);

        tr.find('.discard_col, .valid_col').css('display', 'none');
        tr.find('.rmv_col, .edit_col').css('display', 'inline-block');

        tr.removeClass(['new_row', 'edit_row']);
        tools.disable_tags_input();
    },

    enable_row: function(tr=false) {
        var self = this;
        tr.find('input[name="txt_col_name"]').removeAttr('disabled');
        tr.find('select[name="sel_cur_data_type"]').removeAttr('disabled');
        tr.find('input[name="cb_basic"]').removeAttr('disabled');
        tr.find('input[name="cb_required"]').removeAttr('disabled');
        tr.find('input[name="cb_non_qc"]').removeAttr('disabled');
        tr.find('select[name="sel_cur_prec"]').removeAttr('disabled');
        tr.find('input[name="txt_cur_unit"]').removeAttr('disabled');

        tr.find('.discard_col, .valid_col').css('display', 'inline-block');
        tr.find('.rmv_col, .edit_col').css('display', 'none');

        tools.enable_tags_input(tr);
    }
}
