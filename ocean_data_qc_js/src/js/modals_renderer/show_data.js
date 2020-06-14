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
const { clipboard } = require('electron')

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
                        }).append($('<button>', {
                            id: 'close_df_data',
                            type: 'button',
                            class: 'btn btn-sm btn-primary',
                            text: 'Close View'
                        })).append($('<button>', {
                            id: 'cp_to_clipboard_df_data',
                            type: 'button',
                            class: 'btn btn-sm btn-primary',
                            text: 'Copy to clipboard'
                        }))
                    );
                    $('#close_df_data').click(function() {
                        // $('.df_data').fadeOut('slow');        // TODO: too heavy to make animation?
                        // $('.float_button').fadeOut('slow');
                        $('.df_data').remove();
                        $('.float_button').remove();
                    });

                    $('#cp_to_clipboard_df_data').click(function() {
                        var df_data = $('.df_data table').clone();
                        df_data.find('thead>tr>th').eq(0).remove();
                        df_data.find('tbody tr>th').remove();
                        df_data.find('table').removeAttr('class style');
                        df_data.find('tr').removeAttr('class style');
                        df_data.find('th').removeAttr('class style');
                        df_data.find('th').each(function() { $(this).text($(this).text()); });

                        // TODO: replace nan values?

                        clipboard.writeHTML(df_data.html());

                        tools.show_snackbar(  // this is not appearing because the other div has mor z-index?
                            'Table content copied in the clipboard as HTML text. ' +
                            'You can now paste it in a spreadsheet with Ctrl+V'
                        );
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
