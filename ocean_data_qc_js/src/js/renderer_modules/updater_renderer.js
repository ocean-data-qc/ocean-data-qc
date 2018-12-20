// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

const path = require('path');
const app_module_path = require('app-module-path')
app_module_path.addPath(path.join(__dirname, '../modules'));
app_module_path.addPath(path.join(__dirname, '../modals_renderer'));
app_module_path.addPath(__dirname);

const lg = require('logging');
const { ipcRenderer } = require('electron');
const is_dev = require('electron-is-dev');

lg.info('>> UPDATE RENDERER.js')

if (!is_dev) {
    $('#update_state').text('Checking for update...');
    $('#update_state').removeClass().addClass('update_working');
}

ipcRenderer.on('show-update-available', (event, arg) => {
    $('#update_state').text('');
    $('#update_state').append($('<a>', {
        text: 'Press to update to the new version',
        href: '#'
    })).removeClass().addClass('update_done');

    $('#update_state a').on('click', () => {
        ipcRenderer.send('download-new-update');
    })
});

ipcRenderer.on('show-up-to-date', (event, arg) => {
    $('#update_state').text('Current version is up-to-date.')
    $('#update_state').removeClass().addClass('update_done');
});

ipcRenderer.on('show-update-error', (event, arg) => {
    if ('error' in arg) {
        $('#update_state').text('Error checking updates: ' + arg['error']);
    } else {
        $('#update_state').text('Error checking updates');
    }
    $('#update_state').removeClass().addClass('update_error');
});

ipcRenderer.on('show-download-progress', (event, arg) => {
    if ('percent' in arg) {
        $('#update_state').text('Downloading updates: ' + arg['percent'] + '%').removeClass().addClass('update_working');
    } else {
        $('#update_state').text('Downloading updates...').removeClass().addClass('update_working');
    }
});
