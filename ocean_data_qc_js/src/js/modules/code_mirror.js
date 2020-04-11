// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const fs = require('fs')
const logger = require('logging');

module.exports = {
    load: function(textarea_id, mode_str='json'){
        // TODO: add the needed headers by JavaScript (dynamically) if they are not included yet,
        //       instead of do it in the HTML file
        self = this;
        var mode = {};
        if (mode_str == 'json'){
            mode = {name: "javascript", json: true};   // or only "javascript"
        } else {
            mode = {name: mode_str };
        }

        var textarea = document.getElementById(textarea_id);  // all the modal forms should have a textarea with this id
        self.editor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,                        // when the indentation is removed the numbers are overwritten
            mode: mode,
            lineSeparator: null,                      // CRLF, CR, LF
            theme: "monokai",                         // the theme css should be included in main.html
            indentUnit: 4,
            smartIndent: true,
            autoRefresh: true,
        });
    },
    getValue: function () {
        // Return the text value of the textarea
        self = this;
        var value = self.editor.getDoc().getValue();
        return value;
    },
    setValue: function (value) {
        // Set a new value to the textarea
        self = this;
        self.editor.getDoc().setValue(value);
        return true;
    },
    writeValue: function (path) {
        // Save the textarea value to the disk in the path location
        self = this;
        var value = self.editor.getDoc().getValue();
        fs.writeFile(path, value, 'utf-8', (err) => {
            if (err) throw err;
            logger.info('-- WRITE CODEMIRROR VALUE TO FILE');
        });
        return true;
    },
}