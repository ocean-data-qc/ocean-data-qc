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

// TODO: hardcoded path, find a better way to get this path without calling to a python script
//       >> maybe looking for the folder name or some file >> too slow and asyncronous?
var __ocean_data_qc = path.join(            // installed in env, but not in the system
    __ocean_data_qc_js,
    '../env/win/Lib/site-packages/ocean_data_qc-0.8-py3.6.egg/ocean_data_qc'
);

if (!fs.existsSync(__ocean_data_qc)) {      // development path
    __ocean_data_qc = path.join(__ocean_data_qc_js, '../ocean_data_qc');
}

const locations = {
    // GENERAL FOLDERS
    'ocean_data_qc_js': __ocean_data_qc_js,
    'user_data': __user_data,
    'default_files': path.join(__ocean_data_qc, 'files'),
    'files': path.join(__user_data, 'files'),
    'modals': path.join(__ocean_data_qc_js, 'src/html/modals'),
    'html': path.join(__ocean_data_qc_js, 'src/html'),
    'img': path.join(__ocean_data_qc_js, 'src/img'),

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

    // BOKEH SERVER LAUNCHERS

    'python_win': path.join(__ocean_data_qc_js, '../env/win/python.exe'),
    'ocean_data_qc_win': __ocean_data_qc,

    'ocean_data_qc_win_dev': __ocean_data_qc,

    'python_mac': path.join(__ocean_data_qc_js, '../env/mac/bin/python'),
    'ocean_data_qc_mac_dev': __ocean_data_qc,

    'python_lin': path.join(__ocean_data_qc_js, '../env/lin/bin/python'),
    'ocean_data_qc_lin_dev': __ocean_data_qc,
}

module.exports = locations;  // can this be here?