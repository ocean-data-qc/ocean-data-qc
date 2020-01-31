// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');


module.exports = {
    init: (web_contents) => {
        var self = this;
        self.web_contents = web_contents;
        self.updater = {};                   // = new Object()
        autoUpdater.autoDownload = false;    // Do not download it automatically

        autoUpdater.on('error', (error) => {
            setTimeout(function() {
                self.web_contents.send('show-update-error', {'error': 'Repository cannot be reached' })
            }, 2000);
            self.updater.enabled = true;
            self.updater = null;
            // dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
        })

        /** Emitted when there is an available update.
         *  The update is downloaded automatically if autoDownload is true. */
        autoUpdater.on('update-available', () => {
            self.web_contents.send('show-update-available')
        })

        autoUpdater.on('download-progress', (progressObj) => {
            // let log_message = "Download speed: " + progressObj.bytesPerSecond;
            self.web_contents.send('show-download-progress', {'percent': parseInt(progressObj.percent) })
        })

        autoUpdater.on('update-not-available', () => {
            self.web_contents.send('show-up-to-date')

            self.updater.enabled = true;
            self.updater = null;
        })

        autoUpdater.on('update-downloaded', () => {
            dialog.showMessageBox({
                title: 'Install Updates',
                message: 'Updates downloaded, application will be quit for update...'
            }).then(() => {
                setImmediate(() => autoUpdater.quitAndInstall())   // node >= 0.10
            });
        })
    },

    listeners: () => {
        ipcMain.on('download-new-update', (event, arg) => {
            autoUpdater.downloadUpdate();
        });
    },

    // export this to MenuItem click callback
    check_for_updates: (menuItem, focusedWindow, event) => {
        var self = this;
        // self.updater = menuItem
        self.updater.enabled = false
        autoUpdater.checkForUpdates()
    }
}
