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
        self.cs_cols = data.get('columns', loc.custom_settings);
        // lg.warn('>> CUSTOM SETTINGS COLS: ' + JSON.stringify(self.cs_cols, null, 4));
        if (Object.keys(self.cs_cols).length > 1 && Object.keys(self.cs_cols).length > 1 ) {
            var url = path.join(loc.modals, 'column_app.html');
            tools.load_modal(url, function() {
                self.parse_data();
                self.load_add_column_button();
            });
        } else {
            tools.show_modal({
                'msg_type': 'text',
                'type': 'ERROR',
                'msg': 'There are not columns or settings files could not be read.',
            });
        }
    },

    parse_data: function() {
        lg.warn('-- PARSE DATA COL SETTINGS')
        var self = this;
        var cols = Object.keys(self.cs_cols);  // are they sorted?

        for (var i = 1; i < cols.length; i++) {
            var col_name = cols[i];
            var txt_col_name = self.get_txt_col_name(col_name);
            var txt_orig_name = self.get_txt_orig_name(col_name);
            var data_type = self.get_data_type(col_name)
            var sel_cur_prec = self.get_cur_prec(col_name, data_type);
            var txt_cur_unit = self.get_txt_cur_unit(col_name);
            var bt_rmv = self.get_rmv_bt();

            var tr = $('<tr>');
            tr.append(
                $('<td>', {html: txt_col_name }),
                $('<td>', {html: txt_orig_name }),
                $('<td>', {html: data_type }),
                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
                $('<td>', {html: bt_rmv }),
            );

            $('#table_column_app tbody').append(tr);

        }
        $('[data-toggle="tooltip"]').tooltip();
        $('#modal_column_app').click();

        $('#column_app_win').on('shown.bs.modal', function (e) {
            lg.warn('-- MODAL LOADED');

            self.data_table = $('#table_column_app').DataTable( {  // TODO: show only when rendered
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
                    // Apply the search
                    lg.warn('-- INIT COMPLETE');
                    $('#div_column_app').animate({ opacity: 1, }, { duration: 100, });
                    self.set_tags_input();

                },
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
                        var s = $('#table_column_app_filter input[type="search"]').val()

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
    },

    get_txt_col_name: function(col_name=false) {
        var self = this;
        var input = $('<input>', {
            name: 'txt_col_name',
            class: 'form-control form-control-sm',
            type: 'text',
            value: col_name === false ? '' : col_name
        });
        input.on('change', function() {
            // Update the current value of the field and reload the table "data"
            // to make work the search again

            $(this).attr('value', $(this).val());
            var td = $(this).parent('td');
            $('#table_column_app').DataTable().cell(td).data(td.html()).draw();
        });
        return input;
    },

    get_txt_orig_name: function(col_name=false) {
        lg.warn('-- GET TXT ORIG NAME');
        lg.warn('>> COL NAME: ' + col_name);
        var self = this;
        var orig_name = [];
        if (col_name !== false) {
            orig_name = self.cs_cols[col_name]['orig_name'];
        }
        var tags_input = orig_name.join(',');
        return $('<input>', {
            'name': 'txt_orig_name',
            'class': 'form-control form-control-sm',
            'type': 'text',
            'data-role': 'tagsinput',
            'value': tags_input,
        });
    },

    get_data_type: function(col_name=false) {
        var self = this;
        var tmp_data_type = '';
        if (col_name !== false) {
            var tmp_data_type = self.cs_cols[col_name]['data_type'];
        }
        // lg.warn('>> TMP DATA TYPE: ' + tmp_data_type);

        var sel_cur_data_type = $('<select>', {
            class: 'form-control form-control-sm',
            name: 'sel_cur_data_type',
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

    sel_data_type_change: function(sel_cur_data_type) {
        var self = this;
        sel_cur_data_type.on('change', function() {
            // none > precision 'none' disabled
            // integer > precision 0 disabled
            // string > precision 'none' disabled
            // float > precision 1 enabled
            lg.warn('>> SEL DATA TYPE CHANGE')

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
                // lg.warn('>> SEL: ' + self.cs_cols[col_name]['precision'] + ' | ' + parseInt(j))
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
            value: cur_unit
        });
        // TODO: ask if string fields can have units
        // if (self.cs_cols[col_name]['data_type'] === 'string') {
        //     txt_cur_unit.attr('disabled', true);
        // }
        return txt_cur_unit;
    },

    get_rmv_bt: function() {
        var bt = $('<button>', {
            class: 'delete_col btn btn-danger fa fa-trash',
            type: 'button'
        });
        bt.on('click', function() {
            lg.warn('>> REMOVE ROW');
            var tr = $(this).parents('tr');

            // CHECK IF THE PARAM IS BEING USED IN the calculated equations
            var col = tr.find('input[name="txt_col_name"]').val();
            lg.warn('>> COL: ' + col);
            var cps = data.get('computed_params', loc.default_settings);
            var col_in_cps = [];
            cps.forEach(function(elem) {
                if (elem.equation.includes(col)) {
                    col_in_cps.push(elem.param_name);
                }
            });
            lg.warn('>> CP WITH THE REMOVED COLUMN: ' + col_in_cps);
            if (col_in_cps.length == 0) {
                tools.modal_question({
                    'title': 'Remove row?',
                    'msg': 'Are you sure you want to remove this row?',
                    'callback_yes': function() {
                        var data_table = $('#table_column_app').DataTable();  // get the obj reference if it is already crated
                        data_table.row(tr).remove().draw();

                        // TODO: remove the associated column as well (flag or viceversa)

                        tools.show_snackbar('Column ' + col + ' removed');
                    },
                })
            } else {
                tools.show_modal({
                    msg_type: 'text',
                    type: 'ERROR',
                    msg: 'The column ' + col + ' is used in the following calculared parameters and cannot be removed or edited:',
                    code: col_in_cps.join('\n')
                });
            }
        });
        return bt;
    },

    load_add_column_button: function() {
        var self = this;
        $('#add_column').on('click', function() {
            var txt_col_name = self.get_txt_col_name();
            var txt_orig_name = self.get_txt_orig_name();
            var data_type = self.get_data_type()
            var sel_cur_prec = self.get_cur_prec();
            var txt_cur_unit = self.get_txt_cur_unit();
            var bt_val = self.get_validate_bt();

            var tr = $('<tr>');
            tr.append(
                $('<td>', {html: txt_col_name }),
                $('<td>', {html: txt_orig_name }),
                $('<td>', {html: data_type }),
                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
                $('<td>', {html: bt_val }),
            );

            var data_table = $('#table_column_app').DataTable();
            var row = $(data_table.row(0).node());

            // TODO: this animation is not working well sometime when many rows are created (reindex table?)
            $('#div_column_app .dataTables_scrollBody').animate({ scrollTop: row.offset().top }, 2000, function() {
                data_table.row.add(tr).draw();
                var index = 0;      // 0 sets the index as the first row
                var row_count = data_table.data().length-1;
                var inserted_row = data_table.row(row_count).data();

                for (var i = row_count; i > index; i--) {
                    var temp_row = data_table.row(i-1).data();
                    data_table.row(i).data(temp_row);
                    data_table.row(i-1).data(inserted_row);
                }
                //refresh the page
                data_table.draw(false);

                var row = data_table.row(0).node();
                $(row).addClass('new_col');

                self.set_tags_input();

            });
        });
    },

    get_validate_bt: function() {
        lg.warn('-- GET VALIDATE BUTTON');
        var self = this;
        var bt = $('<button>', {
            'class': 'validate_col btn btn-success fa fa-check',
            'type': 'button',
            'title': 'Validate column field',
            'data-toggle': 'tooltip',
            'data-placement': 'bottom',
        });
        bt.tooltip();

        bt.on('click', function() {
            lg.warn('>> VALIDATE ROW');
            var tr = $(this).parents('tr');

            var cps = data.get('computed_params', loc.custom_settings);
            var cps_list = []
            cps.forEach(function(elem) {
                cps_list.push(elem.param_name);
            });

            var col = tr.find('input[name="txt_col_name"]').val();
            var cs_cols = Object.keys(self.cs_cols);

            if (cs_cols.includes(col)) {
                tools.show_modal( {
                    msg_type: 'text',
                    type: 'VALIDATION ERROR',
                    msg: 'The column ' + col + ' already exists.',
                })
            } else if (cps_list.includes(col)) {
                tools.show_modal({
                    msg_type: 'text',
                    type: 'VALIDATION ERROR',
                    msg: 'The column ' + col + ' is a calculated parameter name.' +
                         ' You need to use a different one',
                })
            } else {
                tr.removeClass('new_col');

                // replace button
            }
        });
        return bt
    },

    set_tags_input: function() {
        $("input[data-role=tagsinput], select[multiple][data-role=tagsinput]").tagsinput({
            confirmKeys: [
                13,     // carriage return (enter, but it does not work)
                44,     // comma
                32,     // space
                59      // semicolon
            ]
        });
    }
}
