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

                $('.data_type_col').attr({
                    'data-toggle': 'tooltip',
                    'data-placement': 'bottom',
                    'data-html': true,
                    'title': $('#possible_data_types').html()
                });
                $('.col_attrs_col').attr({
                    'data-toggle': 'tooltip',
                    'data-placement': 'bottom',
                    'data-html': true,
                    'title': $('#possible_col_attrs').html()
                });
                $('[data-toggle="tooltip"]').tooltip();
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
        $('#column_project_win').on('shown.bs.modal', function (e) {
            $('#table_column_project').DataTable( {  // TODO: show only when rendered
                scrollY: 400,
                scrollCollapse: true,
                paging: false,
                searching: true,
                ordering: true,
                order: [[ 1, 'asc' ]],
                info: false,
                columnDefs: [
                    { targets: '_all', visible: true, },
                    {
                        targets: 0,
                        type: 'html-num',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_cb_export(
                                    meta.row,   // meta => col, row
                                    data
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '0.6rem',
                        searchable: false
                    },
                    {
                        targets: 4,
                        type: 'html-num',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_prec(
                                    $(row[1]).text(),
                                    data
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '1.2rem',
                        searchable: false
                    },
                    {
                        targets: 5,
                        type: 'html',
                        render: function (data, type, row, meta) {
                            if (type == 'display') {
                                return self.get_unit(
                                    $(row[1]).text(),
                                    data,
                                    row[3]
                                );
                            } else {
                                return data;
                            }
                        },
                        width: '6rem',
                        searchable: false
                    },
                    { targets: [6], orderable: false, searchable: false, },
                ],
                initComplete: function () {
                    const api = this.api()
                    self.populate_rows(api);
                    self.set_events();

                    $('[data-toggle="tooltip"]').tooltip();
                    $('#div_column_project').animate({ opacity: 1, }, { duration: 100, });
                },

                // to keep the scroll position after draw() method
                preDrawCallback: function (settings) {
                    self.scroll_pos = $('#div_column_project div.dataTables_scrollBody').scrollTop();
                },
                drawCallback: function (settings) {
                    $('#div_column_project div.dataTables_scrollBody').scrollTop(self.scroll_pos);
                }
            })
        });
        $('#modal_column_project').click();
    },

    populate_rows(api) {
        var self = this;
        var cols = Object.keys(self.pj_cols);
        cols.sort();
        for (var i = 0; i < cols.length; i++) {
            var col_name = cols[i];
            var name = self.get_col_name(col_name);
            var data_type = self.get_data_type(col_name)
            var attrs = self.pj_cols[col_name]['attrs'].join(', ');  // TODO: translate to icons or extract just some of them?
            var set_bt = self.get_set_bt(col_name, self.pj_cols[col_name]['attrs']);
            api.row.add([
                self.pj_cols[col_name]['export'],
                name.prop('outerHTML'),
                data_type,
                attrs,
                self.pj_cols[col_name]['precision'],
                self.pj_cols[col_name]['unit'],
                set_bt.prop('outerHTML')
            ])
        }
        api.draw();
    },

    set_events: function() {
        var self = this;
        var tbody = $('#div_column_project tbody');
        tbody.on('change', 'select[name="sel_cur_prec"]', function() {
            var dt = $('#table_column_project').DataTable();
            var new_val = $(this).val();
            if (new_val != 'none') {
                new_val = parseInt(new_val);
            }
            var cell = dt.cell($(this).parents('td'))
            cell.data(new_val).draw();
        });

        tbody.on('change', 'input[name="cb_export"]', function() {
            var dt = $('#table_column_project').DataTable();
            var new_val = $(this).prop('checked');
            var cell = dt.cell($(this).parents('td'))
            cell.data(new_val).draw();
        });

        tbody.on('change', 'input[name="txt_cur_unit"]', function() {
            var dt = $('#table_column_project').DataTable();
            var new_val = $(this).val();
            var cell = dt.cell($(this).parents('td'))
            cell.data(new_val).draw();
        });

        tbody.on('click', 'button.set_whp:not(:disabled)', function() {
            var p = parseInt($(this).attr('precision'));
            var u = $(this).attr('unit');
            var dt = $('#table_column_project').DataTable();
            if (u !== 'false') {
                var cell = dt.cell($(this).parents('tr').find('td').eq(5))
                cell.data(u).draw();
            }
            if (p !== 'false') {
                var cell = dt.cell($(this).parents('tr').find('td').eq(4))
                cell.data(p).draw();
            }
        })
    },

    set_save_bt: function() {
        var self = this;
        $('#save_settings').on('click', function() {
            var dt = $('#table_column_project').DataTable();
            dt.search('').draw();  // to show all the table in order to get the values
                                   // the alternative would be to save all the events in the rows
            var valid = true;
            $.each($('#div_column_project tbody tr'), function(i, node) {
                node = $(node);
                var col_name = node.find('.td_col_name').text();
                var cb_export = node.find('input[name="cb_export"]').prop('checked');

                var sel_cur_prec = false;
                if (node.find('select[name="sel_cur_prec"]').val() != '-1') {
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
        var name_span = $('<span>', {
            text: name,
            class: 'td_col_name'
        });
        var external_name = self.pj_cols[name]['external_name'];
        var name_row = false;
        if (external_name.length > 0) {
            name_row = $('<div>').append(
                name_span,
                $('<i>', {
                    'class': 'fa fa-info-circle',
                    'style': 'cursor: pointer; color: #337ab5; margin-left: 8px; font-size: 0.8rem;',
                    'title': '<b>External name:</b><br />' + external_name,
                    'data-toggle': 'tooltip',
                    'data-placement': 'bottom',
                    'data-html': 'true',
                })
            );
        } else {
            name_row = name_span;
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
            return data_type.prop('outerHTML');
        } else {
            return data_type;
        }
    },

    get_cb_export: function(row=false, exp_val=false) {
        var self = this;
        var cb_export = $('<div>', {
            class: 'form-check abc-checkbox abc-checkbox-primary'
        }).append(
            $('<input>', {
                id: 'cb_export_row_' + row,
                class: 'form-check-input',
                name: 'cb_export',
                type: 'checkbox',
                checked: exp_val
            })
        ).append(
            $('<label>', {
                for: 'cb_export_row_' + row,
                class: 'form-check-label'
            })
        );
        return cb_export.prop('outerHTML');
    },

    get_prec: function(col_name=false, prec=false) {
        var self = this;
        var sel_cur_prec = $('<select>', {
            class: 'form-control form-control-sm',
            name: 'sel_cur_prec',
        })
        if (prec !== false) {
            for (var j = 0; j < 16; j++) {
                var opt = $('<option>', {
                    value: j,
                    text: j
                });
                if (prec === j) {
                    opt.attr('selected','selected');
                }
                sel_cur_prec.append(opt);
            }
        } else {
            sel_cur_prec.append($('<option>', {  // just one option is enough
                value: '-1',
                text: 'None',
            }))
        }
        if (self.pj_cols[col_name]['data_type'] != 'float') {
            sel_cur_prec.attr('disabled', true);
        }
        return sel_cur_prec.prop('outerHTML');
    },

    get_unit: function(col_name=false, unit=false, attrs=false) {
        var self = this;
        lg.warn('>> ATTRS: ' + JSON.stringify(attrs, null, 4));
        var attrs = attrs.split(', ');
        var u = unit;
        if (unit === false) {
            u = ''
        }
        var txt_cur_unit = $('<input>', {
            name: 'txt_cur_unit',
            class: 'form-control form-control-sm',
            type: 'text',
            value: u
        });
        var t = ['empty', 'string'];
        if (t.includes(self.pj_cols[col_name]['data_type']) || attrs.includes('flag')) {
            txt_cur_unit.attr('disabled', true);
        }
        return txt_cur_unit.prop('outerHTML');
    },

    get_set_bt: function(col_name=false, attrs=false) {
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

        if (attrs.includes('flag')) {
            set_bt_disabled = true;
            set_bt_title_str = '';
        }

        var set_bt = $('<button>', {
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
        return set_bt;
    }
}
