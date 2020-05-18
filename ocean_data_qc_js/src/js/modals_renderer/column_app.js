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

        self.pj_cols = data.get('columns', loc.proj_settings);
        self.cs_cols = data.get('columns', loc.custom_settings);

        // lg.warn('>> CUSTOM SETTINGS COLS: ' + JSON.stringify(self.cs_cols, null, 4));

        if (Object.keys(self.cs_cols).length > 1 && Object.keys(self.cs_cols).length > 1 ) {
            var url = path.join(loc.modals, 'column_app.html');
            tools.load_modal(url, function() {
                self.parse_data();
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
            var name = self.get_col_name(col_name);
            var data_type = self.get_data_type(col_name)
            var sel_cur_prec = self.get_cur_prec(col_name, data_type);
            var txt_cur_unit = self.get_txt_cur_unit(col_name);

            var tr = $('<tr>');
            tr.append(
                name,
                $('<td>', {html: data_type }),
                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
            );

            $('#table_column_app tbody').append(tr);

        }
        $('[data-toggle="tooltip"]').tooltip();
        $('#modal_column_app').click();

        $('#column_app_win').on('shown.bs.modal', function (e) {
            lg.info('-- MODAL LOADED');
            $('#table_column_app').DataTable( {  // TODO: show only when rendered
                scrollY: 400,
                scrollCollapse: true,
                paging: false,
                searching: true,
                ordering: true,
                info: false,
            });
        });
    },

    get_col_name: function(name=false) {
        var self = this;
        var name_row = $('<td>', {
            text: name
        });
        return name_row;
    },

    get_data_type: function(col_name=false) {
        var self = this;
        var tmp_data_type = self.cs_cols[col_name]['data_type'];
        lg.warn('>> TMP DATA TYPE: ' + tmp_data_type);

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
            val: cur_unit
        });
        if (self.cs_cols[col_name]['data_type'] === 'string') {
            txt_cur_unit.attr('disabled', true);
        }
        return txt_cur_unit;
    }
}
