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

const {ipcRenderer} = require('electron');
const codemirror = require('code_mirror');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');

module.exports = {
    init: function(){
        self = this;
        ipcRenderer.on('json-app', (event, arg) => {
            var url = path.join(loc.modals, 'json_app.html');
            tools.load_modal(url, () => {
                codemirror.load('txt_json_app');
                var json_content = data.load(loc.custom_settings);
                codemirror.setValue(JSON.stringify(json_content, null, 4));

                $('#json_app_save').on('click', function() {
                    var settings_str = codemirror.getValue();
                    try {
                        JSON.parse(settings_str);
                    } catch(err) {
                        webContents.send('show-modal', {
                            'type': 'ERROR',
                            'msg': 'It is not a right JSON structure!'
                        });
                        return;
                    }
                    codemirror.writeValue(loc.custom_settings);
                });

                $('#modal_trigger_json_app').click();
            });
        });
    },
}