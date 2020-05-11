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
const server_renderer = require('server_renderer');

module.exports = {
    init: function(){
        self = this;
        ipcRenderer.on('json-project', (event, arg) => {
            var url = path.join(loc.modals, 'json_project.html');
            tools.load_modal(url, () => {
                codemirror.load('txt_json_project');
                var json_content = data.load(loc.proj_settings);
                codemirror.setValue(JSON.stringify(json_content, null, 4));

                $('#accept_reload').on('click', function() {
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
                    codemirror.writeValue(loc.proj_settings);

                    server_renderer.reload_bokeh();
                });

                $('#modal_trigger_json_project').click();
            });
        });
    },
}