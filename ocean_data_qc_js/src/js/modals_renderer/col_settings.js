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

const fs = require('fs');
const csv_parse = require('csv-parse');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    load: function() {
        lg.warn('-- LOAD DATA COL SETTINGS')
        var self = this;

        self.pj_cols = data.get('columns', loc.proj_settings);
        self.cs_cols = data.get('columns', loc.custom_settings);

        lg.warn('>> PROJ SETTINGS COLS: ' + JSON.stringify(self.pj_cols, null, 4));
        lg.warn('>> CUSTOM SETTINGS COLS: ' + JSON.stringify(self.cs_cols, null, 4));

        if (Object.keys(self.pj_cols).length > 1 && Object.keys(self.pj_cols).length > 1 ) {
            var url = path.join(loc.modals, 'col_settings_proj.html');
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
        var cols = Object.keys(self.pj_cols);  // are they sorted?

        for (var i = 1; i < cols.length; i++) {
            // "SECT_ID": {
            //     "orig_name": "",
            //     "data_type": "",
            //     "types": [],
            //     "unit": false,
            //     "precision": false
            // },

            var name = cols[i];
            var orig_name = '';
            if (cols[i] != self.pj_cols[cols[i]]['orig_name']) {
                orig_name = self.pj_cols[cols[i]]['orig_name'];
            }
            var types = self.pj_cols[cols[i]]['types'].join(', ');  // translate to icons or extract just some of them?

            // TODO: some column can be in self.pj_cols and not in self.cs_cols
            //       in that case

            var cb_export = $('<input>', {
                name: 'cb_export',
                type: 'checkbox',
                checked: true
            })

            var tmp_prec = self.pj_cols[cols[i]]['precision'];
            var sel_cur_prec = $('<select>', {
                class: 'form-control form-control-sm',
                name: 'sel_cur_prec',
                disabled: true
            })
            if (tmp_prec !== false) {

                for (var j = 0; j < 16; j++) {
                    var opt = $('<option>', {
                        value: j,
                        text: j
                    });
                    if (tmp_prec === j) {
                        // lg.warn('>> SEL: ' + self.pj_cols[cols[i]]['precision'] + ' | ' + parseInt(j))
                        opt.attr("selected","selected");
                        sel_cur_prec.attr('disabled', false);
                    }
                    sel_cur_prec.append(opt);
                }
                if (sel_cur_prec.find('option:selected').text() == 'None') {
                    sel_cur_prec.attr('disabled', true);
                }
            } else {
                sel_cur_prec.append($('<option>', {
                    value: 'none',
                    text: 'None',
                }))
            }



            var cur_unit = '';
            if (self.pj_cols[cols[i]]['unit'] !== false) {
                cur_unit = self.pj_cols[cols[i]]['unit'];
            }
            var txt_cur_unit = $('<input>', {
                name: 'txt_cur_unit',
                class: 'form-control form-control-sm',
                type: 'text',
                val: cur_unit
            });

            var whp_df_unit = false;
            if (cols[i] in self.cs_cols && self.cs_cols[cols[i]]['unit'] !== false) {
                whp_df_unit = self.cs_cols[cols[i]]['unit'];
            }

            var whp_df_prec = false;
            if (cols[i] in self.cs_cols) {
                whp_df_prec = self.cs_cols[cols[i]]['precision'];
            }

            var set_bt_title = []
            var set_bt_disabled = true;
            if (whp_df_unit !== false) {
                set_bt_title.push('Unit: ' + whp_df_unit);
                set_bt_disabled = false;
            }
            if (whp_df_prec !== false) {
                set_bt_title.push('Precision: ' + whp_df_prec);
                set_bt_disabled = false;
            }
            var set_bt_title_str = set_bt_title.join(' | ')

            var set_bt = $('<button>', {
                'id': 'set_whp_row_' + i,
                'type': 'button',
                'class': 'btn btn-primary arrow set_whp',
                'text': 'Set',
                'disabled': set_bt_disabled,
                'title': set_bt_title_str,
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'unit': whp_df_unit,
                'precision': whp_df_prec
            })

            if (set_bt_disabled === false) {
                set_bt.on('click', function() {
                    var p = parseInt($(this).attr('precision'));
                    var u = $(this).attr('unit');
                    lg.warn('>> PRECS' + p);
                    lg.warn('>> UNITS' + u);

                    if (u !== 'false') {
                        $(this).parent().prev().find('input[name="txt_cur_unit"]').val(u);
                    }
                    if (p !== 'false') {
                        $(this).parent().prev().prev().find('select[name="sel_cur_prec"]').val(p)
                    }

                })
            }

            var tr = $('<tr>');
            tr.append(
                $('<td>', {html: cb_export}),
                $('<td>', {text: name}),
                $('<td>', {text: orig_name}),
                $('<td>', {text: self.pj_cols[cols[i]]['data_type'] }),
                $('<td>', {text: types }),

                $('<td>', {html: sel_cur_prec }),  // disable select if false
                // $('<td>', {html: sel_df_prec }),

                $('<td>', {html: txt_cur_unit }),  // disable select if false
                // $('<td>', {html: txt_df_unit }),  // enabled even if unit is false

                $('<td>', {html: set_bt })
            );

            $('#table_col_settings tbody').append(tr);
            $('[data-toggle="tooltip"]').tooltip();

        }
        $('#modal_col_settings').click();
    }
}
