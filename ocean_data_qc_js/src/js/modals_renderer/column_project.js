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

        // lg.warn('>> PROJ SETTINGS COLS: ' + JSON.stringify(self.pj_cols, null, 4));
        // lg.warn('>> CUSTOM SETTINGS COLS: ' + JSON.stringify(self.cs_cols, null, 4));

        if (Object.keys(self.pj_cols).length > 1 && Object.keys(self.pj_cols).length > 1 ) {
            var url = path.join(loc.modals, 'column_project.html');
            tools.load_modal(url, function() {
                self.parse_data();
                self.set_save_bt();
            });
        } else {
            tools.show_modal({
                msg_type: 'text',
                type: 'ERROR',
                msg: 'There are not columns or settings files could not be read.',
            });
        }
    },

    parse_data: function() {
        var self = this;
        var cols = Object.keys(self.pj_cols);  // are they sorted?
        for (var i = 0; i < cols.length; i++) {
            var col_name = cols[i];
            var name = self.get_col_name(col_name);
            var data_type = self.get_data_type(col_name)
            var attrs = self.pj_cols[col_name]['attrs'].join(', ');  // TODO: translate to icons or extract just some of them?
            var cb_export = self.get_cb_export(i, col_name);
            var sel_cur_prec = self.get_cur_prec(col_name);
            var txt_cur_unit = self.get_txt_cur_unit(col_name);
            var set_bt = self.get_set_bt(col_name, i);

            var tr = $('<tr>');
            tr.append(
                $('<td>', {html: cb_export }),
                name,
                $('<td>', {html: data_type }),
                $('<td>', {text: attrs }),
                $('<td>', {html: sel_cur_prec }),
                $('<td>', {html: txt_cur_unit }),
                $('<td>', {html: set_bt })
            );
            $('#table_column_project tbody').append(tr);
        }
        $('[data-toggle="tooltip"]').tooltip();

        $('#column_project_win').on('shown.bs.modal', function (e) {
            $('#table_column_project').DataTable( {  // TODO: show only when rendered
                scrollY: 400,
                scrollCollapse: true,
                paging: false,
                searching: true,
                ordering: true,
                order: [[ 1, 'asc' ]],  // this is the value by default
                info: false,
                columnDefs: [
                    { targets: '_all', visible: true, },
                    { targets: [6], orderable: false, searchable: false, },
                ],
                initComplete: function () {
                    $('#div_column_project').animate({ opacity: 1, }, { duration: 100, });
                },
            });
        });
        $('#modal_column_project').click();
    },

    set_save_bt: function() {
        var self = this;
        // var data_table = $('#table_column_project').DataTable();

        $('#save_settings').on('click', function() {
            lg.warn('>> ROWS: ' + $('#div_column_project tr'))
            var dt = $('#table_column_project').DataTable();
            dt.search('').draw();  // to show all the table in order to get the values
                                   // the alternative would be to save all the events in the rows
            var valid = true;
            $.each($('#div_column_project tbody tr'), function(i, node) {
                lg.warn('>> I: ' + i);
                lg.warn('>> NODE: ' + node);
                node = $(node);
                var col_name = node.find('.td_col_name').text();
                var cb_export = node.find('input[name="cb_export"]').prop('checked');

                var sel_cur_prec = false;
                if (node.find('select[name="sel_cur_prec"]').val() != 'none') {
                    sel_cur_prec = parseInt(node.find('select[name="sel_cur_prec"]').val());
                }

                var txt_cur_unit = false
                if (node.find('input[name="txt_cur_unit"]').val() != '') {
                    txt_cur_unit = node.find('input[name="txt_cur_unit"]').val().toUpperCase();

                    var re = new RegExp('[^A-Z0-9_/-]+', 'g');
                    var l = txt_cur_unit.split(re);
                    if (l.length > 1) {
                        tools.show_modal( {
                            msg_type: 'text',
                            type: 'VALIDATION ERROR',
                            msg: 'The unit field in the column ' + col_name + ' has some invalid characters. You can use: A-Z, 0-9, _, /, -',
                        })
                        valid = false;
                    }
                }
                var d = {
                    attrs: self.pj_cols[col_name].attrs.slice(),
                    data_type: self.pj_cols[col_name].data_type,
                    export: cb_export,
                    external_name: self.pj_cols[col_name].external_name.slice(),
                    precision: sel_cur_prec,
                    unit: txt_cur_unit,
                }
                self.pj_cols[col_name] = d
            })
            if (valid) {
                self.pj_cols = data.set({columns: self.pj_cols }, loc.proj_settings);
                $("#column_project_win").modal("hide");
            }
        });
    },

    get_col_name: function(name=false) {
        var self = this;
        var name_row = $('<td>', {
            text: name,
            class: 'td_col_name'
        });
        var external_name = self.pj_cols[name]['external_name'];
        if (external_name.length > 0) {
            name_row.append(
                $('<i>', {
                    'class': 'fa fa-info-circle',
                    'style': 'cursor: pointer; color: #337ab5; margin-left: 8px; font-size: 0.8rem;',
                    'title': '<b>External name:</b><br />' + external_name,
                    'data-toggle': 'tooltip',
                    'data-placement': 'bottom',
                    'data-html': 'true',
                })
            );
        }
        return name_row;
    },

    get_data_type: function(col_name=false) {
        var self = this;
        var data_type = self.pj_cols[col_name]['data_type'];
        if (data_type == 'none') {
            data_type = $('<span>', {
                style: 'color: red; font-weight: bold;',
                text: 'none'
            });
        }
        return data_type;
    },

    get_cb_export: function(row=false, col_name=false) {
        var self = this;
        var export_col = self.pj_cols[col_name]['export'];
        var cb_export = $('<div>', {
            class: 'form-check abc-checkbox abc-checkbox-primary'
        }).append(
            $('<input>', {
                id: 'cb_export_row_' + row,
                class: 'form-check-input',
                name: 'cb_export',
                type: 'checkbox',
                checked: export_col
            })
        ).append(
            $('<label>', {
                for: 'cb_export_row_' + row,
                class: 'form-check-label'
            })
        );
        return cb_export;
    },

    get_cur_prec: function(col_name=false) {
        var self = this;
        var tmp_prec = self.pj_cols[col_name]['precision'];
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
                    // lg.warn('>> SEL: ' + self.pj_cols[col_name]['precision'] + ' | ' + parseInt(j))
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
        if (self.pj_cols[col_name]['data_type'] == 'none') {
            sel_cur_prec.attr('disabled', true);
        }
        return sel_cur_prec
    },

    get_txt_cur_unit: function(col_name=false) {
        var self = this;
        var cur_unit = '';
        if (self.pj_cols[col_name]['unit'] !== false) {
            cur_unit = self.pj_cols[col_name]['unit'];
        }
        var txt_cur_unit = $('<input>', {
            name: 'txt_cur_unit',
            class: 'form-control form-control-sm',
            type: 'text',
            value: cur_unit
        });
        var t = ['empty', 'string'];
        if (t.includes(self.pj_cols[col_name]['data_type'])) {
            txt_cur_unit.attr('disabled', true);
        }
        return txt_cur_unit;
    },

    get_set_bt: function(col_name=false, row=false) {
        var self = this;
        var whp_df_unit = false;
        if (col_name in self.cs_cols && self.cs_cols[col_name]['unit'] !== false) {
            whp_df_unit = self.cs_cols[col_name]['unit'];
        }
        var whp_df_prec = false;
        if (col_name in self.cs_cols) {
            whp_df_prec = self.cs_cols[col_name]['precision'];
        }

        var set_bt_disabled = true;
        var set_bt_title = []
        if (self.pj_cols[col_name]['data_type'] != 'none') {
            if (whp_df_prec !== false) {
                set_bt_title.push('<b>Precision:</b> ' + whp_df_prec);
                set_bt_disabled = false;
            }
            if (whp_df_unit !== false) {
                set_bt_title.push('<b>Unit:</b> ' + whp_df_unit);
                set_bt_disabled = false;
            }
        }
        var set_bt_title_str = set_bt_title.join('<br />')

        var set_bt = $('<button>', {
            'id': 'set_whp_row_' + row,
            'type': 'button',
            'class': 'btn btn-primary arrow set_whp',
            'text': 'Set',
            'disabled': set_bt_disabled,
            'title': set_bt_title_str,
            'data-toggle': 'tooltip',
            'data-placement': 'bottom',
            'data-html': 'true',

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
        return set_bt;
    }
}
