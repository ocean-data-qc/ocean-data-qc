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

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    init: function(){
        var self = this;
        ipcRenderer.on('show-help-form', (event, args) => {
            // create div to show on the top of everything (use loader to locate it?)
            lg.info('-- SHOW HELP FORM')
            $('#loader_mask').before($('<iframe>', {
                src: loc.help,
                id:  'help_form',
                class: 'help_form_iframe',
                frameborder: 0,
                scrolling: 'no',
                style: 'width: 100%; height: 100%;'
            }));
            $('#loader_mask').before(
                $('<div>', {
                    class: 'help_form_float_button', //  fa fa-arrow-left
                    html: '<button id="close_help_form_bt" type="button" class="btn btn-sm btn-primary">Close View</button>'
                })
            );
            $('#close_help_form_bt').click(function() {
                // $('.df_data').fadeOut('slow');        // TODO: too heavy to make animation?
                // $('.float_button').fadeOut('slow');
                $('.help_form_iframe').remove();
                $('.help_form_float_button').remove();
            });

            // close df_data form if it is open
            if ($('#close_df_data').length > 0) {
                $('#close_df_data').click();
            }
        });
    }
}
