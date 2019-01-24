// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const app_module_path = require('app-module-path')
app_module_path.addPath(path.join(__dirname, '../modules'));
app_module_path.addPath(path.join(__dirname, '../modals_renderer'));
app_module_path.addPath(__dirname);

const {ipcRenderer} = require('electron');
const fs = require('fs');
const csv = require('node-csv').createParser();

// ---------------------------- REQUIRE OWN MODULES ------------------------------------------------ //

const loc = require('locations');
const data = require('data');
const lg = require('logging');
const tools = require('tools');
const watcher = require('watcher_renderer');
const data_renderer = require('data_renderer');
const server_renderer = require('server_renderer');

// ---------------------------- REQUIRE MODAL RENDERERS -------------------------------------------- //

const update_from_external_file = require('update_from_external_file');
require('update_values_by_station');
require('set_project_settings_json').init();
require('set_project_settings_bokeh').init();
require('add_computed_parameter').init();

// ------------------------------- IPC SIGNAL RECEIVERS ----------------------------------------- //

ipcRenderer.on('show-modal-close-project-form', (event, arg) => {
    lg.info('Closing with changes not saved')

    var url = path.join(loc.modals, 'modal_question.html');
    tools.load_modal(url, () => {
        // ICON
        $('#modal_question .modal-title').css('color', '#fd7e14');
        $('#modal_question .modal-title-icon').removeClass().addClass('fa fa-question-circle');

        // INFO
        $('#modal_question_content').html(arg.msg);
        $('#modal_question .modal-title-text').text(arg.title);

        $('#modal_yes').removeAttr('data-dismiss');  // NOTE: I close manually with $('.close').click();
                                                     //       I need to do it to make the wait cursor appear

        $('#modal_yes').on('click', function() {
            tools.show_wait_cursor();
            var proj_settings = data.load(loc.proj_settings);
            if (proj_settings.project_file == false) {
                ipcRenderer.send('save-file-as', {'save_from': 'closing_process'});
            } else {
                ipcRenderer.send('save-file', {'save_from': 'closing_process'});
            }
            $('.close').click();
            tools.show_default_cursor();
        });

        $('#modal_no').on('click', function() {
            data.set({'project_state': 'saved'}, loc.shared_data);
            server_renderer.come_back_to_welcome();
        });
        $('#modal_trigger_modal_question_form').click();
    });
});

ipcRenderer.on('enable-watcher', (event, arg) => {
    watcher.enable_watcher(arg.mark);
});

ipcRenderer.on('disable-watcher', (event, arg) => {
    watcher.disable_watcher();
});

ipcRenderer.on('compare-data', function() {
    var params = {
        'object': 'cruise.data.handler',
        'method': 'compare_data'
    }
    tools.call_promise(params).then((result) => {
        if (result != null) {
            tools.show_default_cursor();
            update_from_external_file.init(result);
        }
    });
})

ipcRenderer.on('show-moves', (event) => {
    var url = path.join(loc.modals, 'modal_show_moves.html');
    tools.load_modal(url, () => {
        fs.stat(path.join(loc.proj_files, 'moves.csv'), function (err, stats) {
            if (stats.size != 0) {
                csv.mapFile(path.join(loc.proj_files, 'moves.csv'), function(err, data) {
                    if (err) {
                        lg.info('ERROR loading moves.csv')
                    }
                    for (var i = 0; i < data.length; i++) {
                        // null values are empty strings => ''
                        var row = [
                            '<tr>',
                            '<th scope="row">' + data[i].index + '</th>',
                            '<td>' + data[i].date + '</td>',
                            '<td>' + data[i].action + '</td>',
                            '<td>' + data[i].description + '</td>',
                            '</tr>'
                        ];
                        lg.info('FILA: ' + row.join(''));
                        $('#table_moves tbody').append(row.join(''));
                    }
                    $('#modal_trigger_show_moves').click();
                });
            } else {
                $('#div_table_moves').text('There is no changes to show');
                $('#modal_trigger_show_moves').click();
            }
        });
    });
});

ipcRenderer.on('export-whp', function() {
    lg.info('-- EXPORT WHP');
    var params = {
        'object': 'cruise.data',
        'method': 'export_whp'
    }
    tools.call_promise(params).then((result) => {
        data_renderer.export_whp_format();
    });
});

ipcRenderer.on('export-csv', function() {
    lg.info('-- EXPORT CSV');
    var params = {
        'object': 'cruise.data',
        'method': 'export_csv'
    }
    tools.call_promise(params).then((result) => {
        data_renderer.export_csv_format();
    });
});

ipcRenderer.on('reset-bokeh', function() {
    lg.info('-- CALLING TO RESET BOKEH')
    server_renderer.reset_bokeh();
});

ipcRenderer.on('show-project-saved-dialog', function() {
    tools.showModal( // send signal
        'INFO',
        'Project saved. Press "Close" in order to come back to the welcome screen',
        null,
        function() {server_renderer.come_back_to_welcome(); }
    );
})