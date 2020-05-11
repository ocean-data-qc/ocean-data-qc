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

// ---------------------------- REQUIRE OWN MODULES ------------------------------------------------ //

const loc = require('locations');
const data = require('data');
const lg = require('logging');
const tools = require('tools');
const watcher = require('watcher_renderer');
const data_renderer = require('data_renderer');
const server_renderer = require('server_renderer');
const bokeh_export = require('bokeh_export');
const action_history = require('action_history');

// ---------------------------- REQUIRE MODAL RENDERERS -------------------------------------------- //

const update_from_external_file = require('update_from_external_file');
require('update_values_by_station');
require('json_project').init();
require('json_app').init();
require('add_computed_parameter').init();
require('show_data').init();
require('show_help_form').init();
require('edit_metadata').init();

// ------------------------------- IPC SIGNAL RECEIVERS ----------------------------------------- //

// TODO: move all this listeners to 'main_renderer.js' or create a new file 'listeners.js'

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
            if (proj_settings.project_file === false) {
                ipcRenderer.send('save-file-as', {'save_from': 'closing_process'});
            } else {
                ipcRenderer.send('save-file', {'save_from': 'closing_process'});
            }
            $('.close').click();
            tools.show_default_cursor();
        });

        $('#modal_no').on('click', function() {
            data.set({'project_state': 'saved'}, loc.shared_data);
            server_renderer.come_back_to_welcome(true);  // reset cruise data as well
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
    var url = path.join(loc.modals, 'modal_moves.html');
    tools.load_modal(url, () => {
        action_history.load();
    });
});

ipcRenderer.on('export-csv', function() {
    lg.info('-- EXPORT CSV');
    var params = {
        'object': 'cruise.data',
        'method': 'export_csv'
    }
    tools.call_promise(params).then((result) => {
        data_renderer.export_csv_format_dialog();
    });
});

ipcRenderer.on('export-whp', function() {
    lg.info('-- EXPORT WHP');
    var params = {
        'object': 'cruise.data',
        'method': 'export_whp'
    }
    tools.call_promise(params).then((result) => {
        data_renderer.export_whp_format_dialog();
    });
});

ipcRenderer.on('export-xlsx', function() {
    lg.info('-- EXPORT XLSX');
    var params = {
        'object': 'cruise.data',
        'method': 'export_csv'  // to create the csv file to add to the spreadsheet
    }
    tools.call_promise(params).then((result) => {
        bokeh_export.export_excel('xlsx');
    });
});

ipcRenderer.on('export-ods', function() {
    lg.info('-- EXPORT ODS');
    var params = {
        'object': 'cruise.data',
        'method': 'export_csv'  // to create the csv file to add to the spreadsheet
    }
    tools.call_promise(params).then((result) => {
        bokeh_export.export_excel('ods');
    });
});

ipcRenderer.on('reset-bokeh', function() {
    lg.info('-- CALLING TO RESET BOKEH')
    server_renderer.reset_bokeh();
});

ipcRenderer.on('reset-bokeh-cruise-data', function() {
    lg.info('-- CALLING TO RESET BOKEH CRUISE DATA')
    server_renderer.reset_bokeh_cruise_data();
});

ipcRenderer.on('show-project-saved-dialog', function() {
    tools.showModal( // send signal
        'INFO',
        'Project saved. Press "Close" in order to come back to the welcome screen',
        null,
        function() {server_renderer.come_back_to_welcome(true); }
    );
})

ipcRenderer.on('close-embed-forms', function() {
    lg.info('-- CLOSE EMBED FORMS')
    tools.close_embed_forms();
});
