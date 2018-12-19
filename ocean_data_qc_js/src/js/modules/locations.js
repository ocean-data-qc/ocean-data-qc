////////////////////////////////////////////////////////////////
//    License, author and contributors information in the     //
//    LICENSE file at the root folder of this application.    //
////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const electron = require('electron');
const fs = require('fs');


var app = null;
if (typeof(electron.remote) !== 'undefined') {
    app = electron.remote.app;
} else {
    app = electron.app
}
const __ocean_data_qc_js = app.getAppPath();
const __user_data = app.getPath('userData');

const locations = {
    // GENERAL FOLDERS
    'ocean_data_qc_js': __ocean_data_qc_js,
    'user_data': __user_data,
    'files': path.join(__user_data, 'files'),
    'default_files': path.join(__ocean_data_qc_js, 'src/files'),
    'modals': path.join(__ocean_data_qc_js, 'src/html/modals'),
    'html': path.join(__ocean_data_qc_js, 'src/html'),
    'img': path.join(__ocean_data_qc_js, 'src/img'),
    'scripts': path.join(__ocean_data_qc_js, 'src/scripts'),

    // LOGGERS
    'logs_folder': path.join(__user_data, 'logs'),
    'log_js': path.join(__user_data, 'logs/debug_js.log'),
    'log_python': path.join(__user_data, 'logs/debug_py.log'),

    // PROJECT FILES
    'proj_settings': path.join(__user_data, 'files/tmp/settings.json'),
    'proj_data': path.join(__user_data, 'files/tmp/data.csv'),
    'proj_moves': path.join(__user_data, 'files/tmp/moves.csv'),
    'proj_files': path.join(__user_data, 'files/tmp'),

    // SETTINGS FILES
    'shared_data': path.join(__user_data, 'files/shared_data.json'),
    'custom_settings': path.join(__user_data, 'files/custom_settings.json'),
    'default_settings': path.join(__user_data, 'files/default_settings.json'),

    // PYTHON EXECUTABLE
    'python_win': path.join(__ocean_data_qc_js, '../env/win/python.exe'),
    'python_mac': path.join(__ocean_data_qc_js, '../env/mac/bin/python'),
    'python_lin': path.join(__ocean_data_qc_js, '../env/lin/bin/python')
}

module.exports = locations;  // can this be here?