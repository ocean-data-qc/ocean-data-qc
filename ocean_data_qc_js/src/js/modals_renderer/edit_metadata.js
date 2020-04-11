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
const fs = require('fs');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');

module.exports = {
    init: function(){
        self = this;
        ipcRenderer.on('edit-metadata', (event, arg) => {
            lg.warn('-- EDIT METADATA')
            var url = path.join(loc.modals, 'edit_metadata.html');
            tools.load_modal(url, () => {
                codemirror.load('edit_metadata_text', 'string');

                fs.readFile(loc.proj_metadata, (err, data1) => {
                    if (err) {
                        tools.show_modal({
                            'msg_type': 'text',
                            'type': 'ERROR',
                            'msg': 'The metadata file could not be opened.',
                        });
                    } else {
                        codemirror.setValue(data1.toString('utf8'));
                    }
                });

                $('#accept_edit_metadata').on('click', function() {
                    codemirror.writeValue(loc.proj_metadata);
                });

                $('#modal_trigger_edit_metadata').click();
            });
        });
    },
}