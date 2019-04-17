// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const electron = require('electron');
const menu = require('electron').Menu;
const {ipcRenderer} = require('electron');
const data = require('data');
const loc = require('locations');
const lg = require('logging');
const path = require('path');

module.exports = {
    init: function(web_contents, menu_actions, server) {
        var self = this;
        self.web_contents = web_contents;
        self.menu_actions = menu_actions;
        self.server = server;
    },

    set_main_menu: function () {
        var self = this;
        self.load_menus();
        var main_menu = [
            self.file_menu,
            self.help_menu
        ];
        menu.setApplicationMenu(
            menu.buildFromTemplate(main_menu)
        );
    },

    set_bokeh_menu: function() {
        var self = this;
        self.load_menus();
        var bokeh_menu = [
            self.bokeh_file_menu,
            self.bokeh_view_menu,
            // self.bokeh_edit_menu,  // elements are no non-selectable, undo and redo not implemented
            self.bokeh_data_menu,
            self.help_menu,
        ];
        try {
            var dev_mode = data.get('dev_mode', loc.shared_data);
            if (dev_mode) {
                bokeh_menu.push(self.bokeh_dev_menu);
            }
        } catch (err) {     // TODO: check why sometimes data.get throws error here:
                            //       Unexpected end of JSON file
            lg.error('>> dev_mode could not be got: ' + err);
        }

        menu.setApplicationMenu(
            menu.buildFromTemplate(bokeh_menu)
        );
    },

    set_empty_menu: function() {
        var self = this;
        var empty_menu = [];
        menu.setApplicationMenu(
            menu.buildFromTemplate(empty_menu)
        );
    },

    load_menus: function() {
        var self = this;

        // ----------------------------- MAIN MENUS ---------------------------------- //

        self.file_menu = {
            label: 'File',
            submenu: [
                { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => { self.menu_actions.open_dialog(); } },
                // { label: 'Go to stack...', accelerator: 'CmdOrCtrl+O', click: () => { self.server.go_to_stack(); } },
                { type: 'separator' },
                { label: "Exit", accelerator: "Command+Q", click: () => { self.menu_actions.server.close_with_exit_prompt(); } }
            ]
        };

        self.help_menu = {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'Learn More About Atlantos',
                    click: function () {
                        electron.shell.openExternal('https://www.atlantos-h2020.eu/')
                    }
                },
                {
                    label: 'Guide to Best Practices for QC',
                    click: function () {
                        electron.shell.openItem(loc.help)
                    }
                }
            ]
        };

        // ----------------------------- BOKEH MENUS ---------------------------------- //

        self.bokeh_file_menu = {
            label: 'File',
            submenu: [
                { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => { self.menu_actions.save_file(); } },
                { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => { self.menu_actions.save_file_as_caught(); } },
                { type: 'separator' },
                { label: 'Export Data (CSV)...', accelerator: 'CmdOrCtrl+D', click: () => { self.web_contents.send('export-csv'); } },
                {
                    label: 'Export Data (WHP)...', accelerator: 'CmdOrCtrl+E',
                    click: function() { self.web_contents.send('export-whp'); }
                },
                { label: 'Export Actions History (CSV)...', accelerator: 'CmdOrCtrl+M', click: () => { self.menu_actions.export_moves(); } },
                { type: 'separator' },
                { label: 'Close Project', accelerator: 'CmdOrCtrl+W', click: () => { self.menu_actions.close_project(); } },
                { label: "Exit", accelerator: "Command+Q", click: () => { self.menu_actions.server.close_with_exit_prompt(); } }
            ],
        }

        self.bokeh_view_menu = {
            label: 'View',
            submenu: [
                { label: 'Actions History', accelerator: 'CmdOrCtrl+A', click: () => { self.menu_actions.show_moves(); } },
                { label: 'Edit Plot Layout', accelerator: 'CmdOrCtrl+L', click: () => { self.menu_actions.edit_plot_layout(); } }
            ]
        }

        self.bokeh_edit_menu = {
            label: 'Edit',
            submenu: [
                { label: "Undo [TO-DO]", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo [TO-DO]", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }

        self.bokeh_data_menu = {
            label: 'Data',
            submenu: [
                {
                    label: 'Update from CSV', accelerator: 'CmdOrCtrl+U',
                    click: () => { self.menu_actions.update_from_csv(); }
                },
                {
                    label: 'Calculated Parameters', accelerator: 'CmdOrCtrl+P',
                    click: function() { self.web_contents.send('add-computed-parameter'); }
                },
                {
                    label: 'Show Data', accelerator: 'CmdOrCtrl+D',
                    click: function() { self.web_contents.send('show-data'); }
                }
            ]
        }

        self.bokeh_dev_menu = {
            label: 'Development',
            submenu: [
                { label: 'Project Settings (JSON)', accelerator: 'CmdOrCtrl+Shift+P', click: () => { self.menu_actions.edit_plot_layout_json(); } },
                { label: 'Logger [TO-DO]', accelerator: 'CmdOrCtrl+L', click: () => { alert('Not implemented yet');} },
                { label: 'Reload Server', accelerator: 'CmdOrCtrl+R', click: () => { self.menu_actions.server.relaunch_bokeh(); } },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                    }
                }
            ]
        }

    },

};
