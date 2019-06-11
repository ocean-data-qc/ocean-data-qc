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
        ipcRenderer.on('show-data', (event, args) => {
            // create div to show on the top of everything (use loader to locate it?)
            lg.info('-- SHOW DATA')

            tools.show_wait_cursor();  // in the mean time data is being loaded

            var params = {
                'object': 'cruise.data.handler',
                'method': 'get_cruise_data_df_to_html',
            }
            tools.call_promise(params).then((results) => {
                if (results == null) {
                    tools.showModal('ERROR', 'Result is NULL')
                } else {
                    var html = results;
                    $('#loader_mask').before($('<div>', {
                        class: 'top_layer df_data',
                        html: html
                    }));
                    $('#loader_mask').before(
                        $('<div>', {
                            class: 'float_button', //  fa fa-arrow-left
                            html: '<button id="close_df_data" type="button" class="btn btn-sm btn-primary">Close View</button>'
                        })
                    );
                    $('#close_df_data').click(function() {
                        lg.warn('Closing df_data');
                        // $('.df_data').fadeOut('slow');        // TODO: too heavy to make animation?
                        // $('.float_button').fadeOut('slow');
                        $('.df_data').remove();
                        $('.float_button').remove();
                    });

                    // close guide if it is open
                    if ($('#close_help_form_bt').length > 0) {
                        $('#close_help_form_bt').click();
                    }

                    tools.show_default_cursor();
                }
            });

            // remove it at the end (similar to data-dismiss functionionality)


        });
    }
}
