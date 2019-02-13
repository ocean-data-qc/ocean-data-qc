// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const fs = require('fs')
const fs_extra = require('fs-extra')
const loc = require('locations');
const lg = require('logging');

module.exports = {
    load: function(path){
        // Return the JSON object to some variable
        var self = this;
        self.path = path;
        try {
            var data = fs.readFileSync(self.path, 'utf8');       // if I use require, is it updated?
            self.data = JSON.parse(data);
        } catch(err) {
            lg.info('Get data error: ' + err);
            throw err;                                      // is this error sent to the parent?
        }
        return self.data;                       // TODO > do not return the object, return a copy
    },

    get: function(attr, path=false) {
        // Return the value or values of the attribute stored in the path argument
        //  * attr: string or list of strings (Array) with the atributes to retrieve
        //  * path: path where the json file is stored
        //  * return: string or object with the requested data

        var self = this;
        if (path != false) {
            self.path = path;
            // lg.info('>> FILE PATH: ' + self.path);
            var data = fs.readFileSync(self.path, 'utf8');       // TODO: if I use require, is it updated?
            // lg.info('>> DATA CONTENT: ' + data)
            self.data = JSON.parse(data);
        }
        if (attr in self.data){
            if (attr.constructor === Array) {
                var attrs = {};
                attr.forEach(function(item) {
                    attrs[item] = self.data[item];
                });
                return attrs;
            } else {  // attr.constructor === String
                return self.data[attr];
            }
        } else {
            lg.error('-- GET >> data.js: The attribute "' + attr + '" is not in the object stored in the path: ' + self.path);
            return false;
        }
    },
    set: function(attrs, path=false) {
        // Update the values of json files
        //  * attrs: object with the attributes and the new values
        //  * path: the path of the json file
        //  * return: true if everything was OK, false in other case

        // lg.info('>> SET: ' + JSON.stringify(attrs, null, 4))
        // lg.info('>> SET PATH: ' + path);

        var self = this;
        try {
            if (path != false) {
                self.path = path;
                var data = fs.readFileSync(self.path, 'utf8');
                self.data = JSON.parse(data);
            }

            if (attrs.constructor == Object) {
                for(var attr in attrs) {
                    if (attr in attrs) {
                        self.data[attr] = attrs[attr];
                    }
                }
            } else {
                lg.error('data.js: ERROR: An Object should be sent to this method');
            }
            fs.writeFileSync(
                self.path,
                JSON.stringify(self.data, null, 4), 'utf-8'
            );
            return true;
        } catch(err) {
            throw err;
        }
    },
    getPath: function () {
        var self = this;
        return self.path;
    },
    write: function(dict){
        var self = this;
        if (typeof(dict) != 'object'){
            return;
        }
        try{
            Object.keys(dict).forEach(function(key) {  // replace forEach with a for loop
                self.data[key] = dict[key];
                // lg.info('SAVED KEY: ' + key + ': ' + dict[key]);
            });
            fs.writeFileSync(
                self.path,
                JSON.stringify(self.data, null, 4), 'utf-8'
            );
        }catch(err){
            throw err;
        }
    },
    write_promise: function(dict) {
        var self = this;
        return new Promise((resolve, reject) => {
            if (typeof(dict) != 'object'){
                resolve(false);
            }
            Object.keys(dict).forEach(function(key) {  // TODO: replace forEach with a for loop
                self.data[key] = dict[key];
            });
            var data_str = JSON.stringify(self.data, null, 4);
            fs.writeFile(self.path, data_str, 'utf-8', (err) => {
                if (err) resolve(false);
                resolve(true);
            });
        });
    },

    writeJsonToPath: function(dict, path){
        // Write a JSON object to a specific path
        var self = this;
        self.path = path;
        self.write(dict);
    },

    print: function() {
        var self = this;
        lg.info('PRINTING DATA: ' + JSON.stringify(self.data, null, 4));
    },

    copy: function(org, dest, callback_close=false) {
        // general copy file function, this is not implemented on the fs node module directly
        var self = this;
        var read = fs.createReadStream(org);
        read.on("error", function(err) {
            webContents.send('show-modal', {  // TODO: does webContents exist here?
                'type': 'ERROR',
                'msg': 'The file could not be saved!'
            });
        });

        var write = fs.createWriteStream(dest);
        write.on("error", function(err) {
            webContents.send('show-modal', {
                'type': 'ERROR',
                'msg': 'The file could not be saved!'
            });
        });
        write.on("close", function(err) {
            if (typeof(callback_close) !== 'undefined' && callback_close != false) {
                callback_close();
            }
        });
        read.pipe(write);
    },

    /** Copies the needed data to start the logger and
     *  start to use the user data configurations
     */
    init_user_data: function() {
        var self = this;
        if (!fs.existsSync(loc.files)) {
            fs.mkdirSync(loc.files);
            fs_extra.copySync(
                loc.default_files,  // TOCHECK: does it work within the asar file?
                loc.files
            )
        }
        if (!fs.existsSync(loc.logs_folder)) {
            fs.mkdirSync(loc.logs_folder);
        }
    },



}