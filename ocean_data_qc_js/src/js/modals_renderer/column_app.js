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
            value: col_name
        });
        input.on('change', function() {
            var td = $(this).parent('td');
            $('#table_column_app').DataTable().cell(td).data($(this).val()).draw();
        });
        return input;
    },

    get_txt_orig_name: function(col_name=false) {
        var self = this;
        var orig_name = self.cs_cols[col_name]['orig_name'];
        return $('<input>', {
            name: 'txt_orig_name',
            class: 'form-control form-control-sm',
            type: 'text',
            value: orig_name
        });
    },

    get_data_type: function(col_name=false) {
        var self = this;
        var tmp_data_type = self.cs_cols[col_name]['data_type'];
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
        var tmp_prec = self.cs_cols[col_name]['precision'];
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
        if (tmp_prec === false) {
            var data_types = ['integer', 'string', 'none'];
            if (data_types.includes(sel_cur_data_type.val())) {
                sel_cur_prec.attr('disabled', true);
                sel_cur_prec.val('none');
            }
        }
        return sel_cur_prec
    },

    get_txt_cur_unit: function(col_name=false) {
        var self = this;
        var cur_unit = '';
        if (self.cs_cols[col_name]['unit'] !== false) {
            cur_unit = self.cs_cols[col_name]['unit'];
        }
        var txt_cur_unit = $('<input>', {
            name: 'txt_cur_unit',
            class: 'form-control form-control-sm',
            type: 'text',
            value: cur_unit
        });
        if (self.cs_cols[col_name]['data_type'] === 'string') {
            txt_cur_unit.attr('disabled', true);
        }
        return txt_cur_unit;
    },

    get_rmv_bt: function() {
        var bt = $('<button>', {
            class: 'delete_col btn btn-danger fa fa-trash',
            type: 'button'
        });
        bt.on('click', function() {
            lg.warn('>> BT CLICK');
            var data_table = $('#table_column_app').DataTable();  // get the obj reference if it is already crated
            var tr = $(this).parents('tr');
            var row = data_table.row(tr);

            lg.warn('>> DATA TABLE: ' + JSON.stringify(data_table, null, 4));
            lg.warn('>> TR: ' + JSON.stringify(tr, null, 4));
            lg.warn('>> ROW: ' + JSON.stringify(row, null, 4));

            if (row.child.isShown()) {
                row.child.remove();
                tr.removeClass('shown');
            }
        });
        return bt;
    },

    load_add_column_button: function() {
        lg.warn('-- LOAD ADD COLUMN BUTTON')
        var self = this;


    },

}
