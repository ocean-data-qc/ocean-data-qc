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

const { ipcRenderer } = require('electron');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    load: function() {
        lg.info('-- LOAD DATA COL SETTINGS')
        var self = this;
        self.tmp_record = {}
        self.cs_cols = data.get('columns', loc.custom_settings);
        self.cps = data.get('computed_params', loc.custom_settings);
        self.update_col_lists();

        if (Object.keys(self.cs_cols).length > 1 && Object.keys(self.cs_cols).length > 1 ) {
            var url = path.join(loc.modals, 'column_app.html');
            tools.load_modal(url, function() {
                self.parse_data();
                self.set_add_col_bt();
                $('[data-toggle="tooltip"]').tooltip();
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
                    {
                        targets: 0,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_txt_col_name(data);
                            } else {
                                return data;
                            }
                        },
                        width: '6rem',
                    },
                    {
                        targets: 1,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_txt_external_name(data);
                            } else {
                                return data;
                            }
                        },
                        width: '6rem',
                    },
                    {
                        targets: 2,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_data_type(data);
                            } else {
                                return data;
                            }
                        },
                        width: '3rem',
                    },
                    {
                        targets: 3,
                        type: 'html-num',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_cb_field(
                                    meta.row,   // meta => col, row
                                    data,
                                    'basic'
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '0.3rem',
                        searchable: false
                    },
                    {
                        targets: 4,
                        type: 'html-num',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_cb_field(
                                    meta.row,   // meta => col, row
                                    data,
                                    'required'
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '0.3rem',
                        searchable: false
                    },
                    {
                        targets: 5,
                        type: 'html-num',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_cb_field(
                                    meta.row,   // meta => col, row
                                    data,
                                    'non_qc'
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '0.3rem',
                        searchable: false
                    },
                    {
                        targets: 6,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_prec(data, $(row[2]).val());
                            } else {
                                return data;
                            }
                        },
                        width: '3rem',
                    },
                    {
                        targets: 7,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_unit(data);
                            } else {
                                return data;
                            }
                        },
                        width: '3rem',
                    },
                    {
                        targets: 8,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return [
                                    self.get_edit_bt(),
                                    self.get_rmv_bt(),
                                    self.get_valid_bt(),
                                    self.get_discard_bt()
                                ].join('');
                            } else {
                                return false;
                            }
                        },
                        width: '3.5rem',
                        searchable: false,
                        orderable: false
                    },
                ],
                initComplete: function () {
                    const api = this.api()
                    self.populate_rows(api);
                    self.set_events();
                    self.disable_prec();

                    $('#div_column_app').animate({ opacity: 1, }, { duration: 100, });
                    tools.set_tags_input();
                    tools.disable_tags_input();
                },

                // to keep the scroll position after draw() method
                preDrawCallback: function (settings) {
                    self.scroll_pos = $('#div_column_app div.dataTables_scrollBody').scrollTop();
                },
                drawCallback: function (settings) {
                    $('#div_column_app div.dataTables_scrollBody').scrollTop(self.scroll_pos);
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
                        var col_name = rowData[0];  // column 0

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

    populate_rows: function(api) {
        var self = this;

        var self = this;
        var cols = Object.keys(self.cs_cols);
        cols.sort();
        for (var i = 0; i < cols.length; i++) {
            var col_name = cols[i];

            var external_name = [];
            if (col_name !== false) {
                external_name = self.cs_cols[col_name]['external_name'];
            }
            var tags_input = external_name.join(',');

            var data_type = '';
            if (col_name !== false) {
                var data_type = self.cs_cols[col_name]['data_type'];
            }

            var attrs = self.cs_cols[col_name]['attrs'];
            var basic = false;
            if (attrs.includes('basic')) {
                basic = true;
            }
            var required = false;
            if (attrs.includes('required')) {
                required = true;
            }
            var non_qc = false;
            if (attrs.includes('non_qc')) {
                non_qc = true;
            }

            var prec = 'none';
            if (col_name !== false) {
                prec = self.cs_cols[col_name]['precision'];
            }

            var unit = '';
            if (col_name !== false) {
                if (self.cs_cols[col_name]['unit'] !== false) {
                    unit = self.cs_cols[col_name]['unit'];
                }
            }

            api.row.add([
                col_name, tags_input, data_type,
                basic, required, non_qc,
                prec, unit
            ])
        }
        api.draw();
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
        return input.prop('outerHTML');
    },

    get_txt_external_name: function(data=false) {
        var self = this;
        return $('<input>', {
            'name': 'txt_external_name',
            'class': 'form-control form-control-sm',
            'type': 'text',
            'data-role': 'tagsinput',
            'value': data,
            'disabled': true
        }).prop('outerHTML');
    },

    get_data_type: function(data_type=false) {
        var self = this;
        var sel_cur_data_type = $('<select>', {
            class: 'form-control form-control-sm',
            name: 'sel_cur_data_type',
            disabled: true
        })
        var opts = [
            'none',  // in case the user does not know the data type of the column or it can be more than one
            'integer', 'float',
            'string', 'date', 'time',
        ]
        opts.forEach(function(o) {
            var opt = $('<option>', {
                value: o,
                text: o
            });
            if (o === 'none' && (data_type === '' || data_type === false)) {
                opt.attr("selected","selected");
            }
            if (data_type === o) {
                opt.attr("selected","selected");
            }
            sel_cur_data_type.append(opt);
        });
        return sel_cur_data_type.prop('outerHTML');
    },

    get_cb_field: function(row=false, checked=false, type=false) {  // if col_name = fals >> new row
        var self = this;
        if (type !== false) {
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
            return cb_export.prop('outerHTML');
        }
    },

    get_prec: function(prec, data_type) {
        var self = this;
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
            if (prec === j) {
                opt.attr("selected","selected");
                sel_cur_prec.attr('disabled', false);
            }
            sel_cur_prec.append(opt);
        }
        return sel_cur_prec.prop('outerHTML');
    },

    /** Disable all the elements in the datatable
     *  This should be used just after all the rows are populated
    */
    disable_prec: function() {
        var self = this;
        $('#table_column_app select[name="sel_cur_prec"]').attr('disabled', true);
    },

    get_unit: function(unit=false) {
        var self = this;
        var txt_unit = $('<input>', {
            name: 'txt_cur_unit',
            class: 'form-control form-control-sm',
            type: 'text',
            value: unit,
            disabled: true,
        });
        return txt_unit.prop('outerHTML');
    },

    get_edit_bt: function() {
        var self = this;
        var bt = $('<button>', {
            class: 'edit_col btn btn-warning fa fa-pencil',
            type: 'button'
        });
        return bt.prop('outerHTML');
    },

    get_rmv_bt: function() {
        var self = this;
        var bt = $('<button>', {
            class: 'rmv_col btn btn-danger fa fa-trash',
            type: 'button'
        });
        return bt.prop('outerHTML');
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
        return bt.prop('outerHTML');
    },

    set_add_col_bt: function() {
        var self = this;
        $('#add_column').on('click', function() {
            $('#add_column').attr('disabled', true);
            var data_table = $('#table_column_app').DataTable();

            var scroll_body = $(data_table.table().node()).parent();
            scroll_body.animate({ scrollTop: 0 }, 500);

            data_table.row.add([
                '', [], 'none',
                false, false, false,
                'none', '', ''
            ]).draw();

            var tr = $('#table_column_app tbody tr').eq(0);
            tr.addClass('new_row');
            tools.set_tags_input(tr);
            self.enable_row(tr);
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
        return bt.prop('outerHTML');
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

    set_events: function() {
        var self = this;
        var tbody = $('#div_column_app tbody');

        tbody.on('click', 'button.valid_col', function() {
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

            ipcRenderer.send('update-tab-app');
            $('#table_column_app').DataTable().draw();
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').removeAttr('disabled');
            $('#add_column').removeAttr('disabled');
        });

        tbody.on('click', 'button.discard_col', function() {
            $('#add_column').removeAttr('disabled');
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

        tbody.on('click', 'button.rmv_col', function() {
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
                        ipcRenderer.send('update-tab-app');
                        tools.show_snackbar('Column ' + col + ' removed');
                    },
                    'self': self
                });
            }
        });

        tbody.on('click', 'button.edit_col', function() {
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
            tools.enable_tags_input(tr);
            $('#div_column_app tr').find('button.edit_col, button.rmv_col').attr('disabled', true);
            self.set_prec_state(
                tr.find('select[name="sel_cur_prec"]'),
                tr.find('select[name="sel_cur_data_type"]').val()
            )
        });

        tbody.on('change', 'select[name="sel_cur_data_type"]',function() {
            // none > precision 'none' disabled
            // integer > precision 0 disabled
            // string > precision 'none' disabled
            // float > precision 1 enabled
            var sel_val = $(this).val();

            // TODO: update the cell value instead of manipulating the html object

            var prec_obj = $(this).parent().parent().find('select[name="sel_cur_prec"]');
            self.set_prec_state(prec_obj, sel_val);
        });

        tbody.on('change', 'input[name="txt_col_name"]', function() {
            var td = $(this).parent('td');
            $('#table_column_app').DataTable().cell(td).data($(this).val().toUpperCase());
        });
    },

    /* Possible data type values:
     *   none > precision 'none' disabled
     *   integer > precision 0 disabled
     *   string, time, date > precision 'none' disabled
     *   float > precision 1 enabled
    */
    set_prec_state: function(prec_obj, data_type) {
        var self = this;
        if (['none', 'string', 'time', 'date'].includes(data_type)) {
            prec_obj.val('none');
            prec_obj.attr('disabled', true);
        } else if (data_type == 'integer') {
            prec_obj.val('0');
            prec_obj.attr('disabled', true);
        } else if (data_type == 'float') {
            prec_obj.val('1')
            prec_obj.attr('disabled', false);
        }
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

            // update plot and key tab names
            var tabs = data.get('qc_plot_tabs', loc.custom_settings);
            tabs[new_col_name] = tabs[self.tmp_record.col_name].slice();
            delete tabs[self.tmp_record.col_name];
            Object.keys(tabs).sort().forEach(function(t) {
                tabs[t].forEach(function(p) {
                    if (p.x == self.tmp_record.col_name) {
                        p.x = new_col_name;
                    }
                    if (p.y == self.tmp_record.col_name) {
                        p.y = new_col_name;
                    }
                });
            });
            data.set({'qc_plot_tabs': tabs }, loc.custom_settings);  // order tabs before?
                                                                     // if a tab is modified it will appear always at the bottom
        }

        self.cps.forEach(function(elem) {
            var re = new RegExp('\\b' + self.tmp_record.col_name + '\\b', 'g');
            elem.equation = elem.equation.split(re).join(new_col_name);  // this updates self.cps
        });

        var ord_cols = {}
        Object.keys(self.cs_cols).sort().forEach(function(c) {
            ord_cols[c] = self.cs_cols[c];
        });

        data.set({'columns': ord_cols}, loc.custom_settings);
        data.set({'computed_params': self.cps}, loc.custom_settings);
    },

    upd_row_values: function(tr=false) {
        var self = this;
        var new_col_name = tr.find('input[name="txt_col_name"]').val().toUpperCase();

        var attrs = [];
        var basic = tr.find('input[name="cb_basic"]').prop('checked')
        if (basic) {
            attrs.push('basic');
        }
        var required = tr.find('input[name="cb_required"]').prop('checked');
        if (required) {
            attrs.push('required');
        }
        var non_qc = tr.find('input[name="cb_non_qc"]').prop('checked');
        if (non_qc) {
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
            data_type: data_type,
            attrs: attrs,
            unit: unit,
            precision: precision,
        }

        if (precision == false) {
            precision = 'none';
        }
        if (unit === false) {
            unit = '';
        }

        var dt = $('#table_column_app').DataTable()
        var dt_row = dt.row(tr);
        dt_row.data([
            new_col_name, external_name.join(','), data_type,
            basic, required, non_qc,
            precision, unit
        ]);
        dt.draw();

        tools.set_tags_input(tr);
        // tools.disable_tags_input();
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
        var prec_obj = tr.find('select[name="sel_cur_prec"]');
        self.set_prec_state(prec_obj, tr.find('select[name="sel_cur_data_type"]').val());
        tr.find('input[name="txt_cur_unit"]').removeAttr('disabled');

        tr.find('.discard_col, .valid_col').css('display', 'inline-block');
        tr.find('.rmv_col, .edit_col').css('display', 'none');

        tools.enable_tags_input(tr);
    },

    reset_tab_app: function() {
        var self = this;
        // tab_app.reset_tabs();

        // $('#qc_tabs_container fieldset').not(
        //     $('#qc_tabs_container fieldset').eq(0)
        // ).remove();
        // tab_app.load_columns();   // we can have the refences to the objects (columns)
        // tab_app.load_tabs();
    }
}
