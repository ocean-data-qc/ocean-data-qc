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

const fs = require('fs');
const csv_parse = require('csv-parse');

const loc = require('locations');
const lg = require('logging');
const data = require('data');
const tools = require('tools');


module.exports = {
    load: function() {
        var self = this;
        var moves_path = path.join(loc.proj_files, 'moves.csv');
        fs.readFile(moves_path, 'utf8', (err, buffer) => {
            if (err) {
                tools.show_modal({
                    'msg_type': 'text',
                    'type': 'ERROR',
                    'msg': 'The moves file could not be read.',
                });
            } else {
                self.buffer = buffer;
                self.parse_csv();
            }
        });
    },

    parse_csv: function() {
        var self = this;
        csv_parse(self.buffer, function(err, records){
            if (records.length > 1) {
                if (err) {
                    tools.show_modal({
                        'msg_type': 'text',
                        'type': 'ERROR',
                        'msg': 'The list of the actions could not be loaded',
                    });
                } else {
                    const INDEX = 0;
                    const DATE = 1;
                    const ACTION = 2;
                    const DESCRIPTION = 10;
                    for (var i = 1; i < records.length; i++) {
                        // null values are empty strings => ''
                        var row = [
                            '<tr>',
                            '<th scope="row">' + records[i][INDEX] + '</th>',
                            '<td>' + records[i][DATE] + '</td>',
                            '<td>' + records[i][ACTION] + '</td>',
                            '<td>' + records[i][DESCRIPTION] + '</td>',
                            '</tr>'
                        ];
                        lg.info('FILA: ' + row.join(''));
                        $('#table_moves tbody').append(row.join(''));
                    }
                    $('#modal_trigger_moves').click();
                }
            } else {
                $('#div_table_moves').text('There is no changes to show');
                $('#modal_trigger_moves').click();
            }
        });
    }
}
