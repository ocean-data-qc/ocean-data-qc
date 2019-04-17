// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const lg = require('logging');

module.exports = {
    /* Disables non active tabs in order to render the profiles later
     * and improve performance
     */
    disable_tabs: function() {
        lg.warn('-- DISABLE TABS');
        var bk_iframe = $("#bokeh_iframe").contents()
        // TODO: this is just an example, find a way to disable the tab while the profiles are not drawn
        // bk_iframe.find('ul.bk-bs-nav>li:not(.bk-bs-active)').css('background-color', 'orange');
        // bk_iframe.find('ul.bk-bs-nav>li.bk-bs-active').css('background-color', '');
    }

}