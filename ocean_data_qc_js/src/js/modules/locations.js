// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

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
    'ocean_data_qc_dev': path.join(__ocean_data_qc_js, '../ocean_data_qc'),
    'user_data': __user_data,
    'files': path.join(__user_data, 'files'),
    'default_files': path.join(__ocean_data_qc_js, 'src/files'),
    'modals': path.join(__ocean_data_qc_js, 'src/html/modals'),
    'html': path.join(__ocean_data_qc_js, 'src/html'),
    'img': path.join(__ocean_data_qc_js, 'src/img'),
    'scripts': path.join(__ocean_data_qc_js, 'src/scripts'),

    // TILE SERVICES
    //'basemap_offile_tile': path.join(__ocean_data_qc_js, 'src/tiles/world_ocean_base_z4.zip'),
    'basemap_offile_tile': path.join(__ocean_data_qc_js, 'src/tiles/etopo1_z4.zip'),

    // LOGGERS
    'logs_folder': path.join(__user_data, 'logs'),
    'log_js': path.join(__user_data, 'logs/debug_js.log'),
    'log_python': path.join(__user_data, 'logs/debug_py.log'),

    // PROJECT FILES
    'proj_settings': path.join(__user_data, 'files/tmp/settings.json'),
    'proj_data': path.join(__user_data, 'files/tmp/data.csv'),
    'proj_moves': path.join(__user_data, 'files/tmp/moves.csv'),
    'proj_files': path.join(__user_data, 'files/tmp'),
    'proj_upd': path.join(__user_data, 'files/tmp/update'),

    // SETTINGS FILES
    'shared_data': path.join(__user_data, 'files/shared_data.json'),
    'custom_settings': path.join(__user_data, 'files/custom_settings.json'),
    'default_settings': path.join(__user_data, 'files/default_settings.json'),

    // PYTHON EXECUTABLE
    'python_win': path.join(__ocean_data_qc_js, '../env/python.exe'),
    'python_mac': path.join(__ocean_data_qc_js, '../env/bin/python'),
    'python_lin': path.join(__ocean_data_qc_js, '../env/bin/python'),

    // ENV BINARIES PATH
    'env_bin_win': path.join(__ocean_data_qc_js, '../env/Scripts'),
    'env_bin_mac': path.join(__ocean_data_qc_js, '../env/bin'),
    'env_bin_lin': path.join(__ocean_data_qc_js, '../env/bin')
}

module.exports = locations;  // can this be here?