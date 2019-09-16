
function get_input_bridge_text() {
    var models = window.Bokeh.index[Object.keys(window.Bokeh.index)[0]].model.document._all_models;
    var model_id = null;
    $.each(models, function (m_id) {
        if (models[m_id].attributes.name == 'bridge_text_input') {
            model_id = m_id;
        }
    });
    return models[model_id];
}

function screenshot() {
    // $("#bokeh_iframe").contents().find('.tabs_widget_col').children().children().not(".bk-tabs-header");
    console.log('-- SCREENSHOT')
    var tabs_title = $('.bk-tabs-header .bk-tab');
    var tabs_order = []
    $.each(tabs_title, function(tab_title_index, tab_title_dom) {
        tabs_order.push($(tab_title_dom).html())
    });
    var tabs = $(".tabs_widget_col>div>div:not('.bk-tabs-header')");
    var tabs_images = {}
    $.each(tabs, function(tab_index, tab_dom){
        var canvas_dom = $(tab_dom).find('.bk-canvas');
        var images = []
        $.each(canvas_dom, function(canvas_key, canvas){
            images.push(canvas.toDataURL("image/png"))
        });
        tabs_images[tabs_order[tab_index]] = images;
        images = [];
    });

    console.log(tabs_images);

    var input_bridge_text = get_input_bridge_text();
    var params = {
        'object': 'bokeh.export',
        'method': 'export_pdf',
        'args': {
            'tabs_images': tabs_images,
            'tabs_order': tabs_order

        }
    }
    input_bridge_text.value = JSON.stringify(params);
    var button = $('.bridge_button>div>button')
    button.click();
}

oldLog = console.log;
console.log = function (message) {
    if(message.localeCompare('Bokeh items were rendered successfully') == 0){
        window.top.postMessage('bokeh-loaded', '*');
        console.log = oldLog;
    }
    oldLog.apply(console, arguments);
};

$(window).keydown(function(event){
    if(event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
    if(event.keyCode == 27) {
        event.preventDefault();
        window.top.postMessage({
            'signal': 'esc-pressed',
        }, '*');                        // to main_renderer.js
        return false;
    }
});

window.onmessage = function(e){
    if (typeof(e.data.signal) != "undefined") {
        if (e.data.signal == 'call-python-promise' || e.data.signal == 'update-bridge-text-value') {
                // this updates dummy text field value and triggers the click event of the bridge_button

                // NOTE: This cannot be replaced defining the onchange event of the dummy text, imagine that
                //       you want to run the same action twice, there would'n be change on the value to trigger the python method

                var input_bridge_text = get_input_bridge_text();
                input_bridge_text.value = JSON.stringify(e.data.message_data);
                var button = $('.bridge_button>div>button')
                button.click();
        } else if (e.data.signal == 'on-ready') {
            console.log('ON READY');

            // NOTE: This is executed (kind of hacky) in order to add styles to the checkboxes
            //       There should be to add them in a more elegant way
            //       Check the bokeh example where fontawesome is used to set custom icons to buttons

            // ------ FIXED PROFILES CHECKBOX ------

            // get current original top absolute position of checkboxes

            var new_fp_cb = $('<div>', {
                class: 'abc-checkbox abc-checkbox-primary bk-fixed-profiles-cb',
            });
            new_fp_cb.append(
                $('<input>', {
                    id: 'id_fixed_profiles_cb',
                    type: 'checkbox'
                })
            );
            new_fp_cb.append(
                $('<label>', {
                    for: 'id_fixed_profiles_cb',
                    text: 'Fixed profiles'
                })
            );
            $('.fixed_profiles_cb').before(new_fp_cb);

            $('#id_fixed_profiles_cb').change(function() {
                if(this.checked) {
                    $('.fixed_profiles_cb input').click();
                } else {
                    $('.fixed_profiles_cb input').click();
                }
            });
            fix_prof_top = parseInt($('.flags_control_col').css('height')) + 15 + 'px'
            $('.bk-fixed-profiles-cb').css('top', fix_prof_top)

            // ------ SHOW NEARBY STATION CHECKBOX -----

            var new_sns_cb = $('<div>', {
                class: 'abc-checkbox abc-checkbox-primary bk-show-nearby-station-cb',
            });

            new_sns_cb.append(
                $('<input>', {
                    id: 'id_show_nearby_station_cb',
                    type: 'checkbox'
                })
            );
            new_sns_cb.append(
                $('<label>', {
                    for: 'id_show_nearby_station_cb',
                    text: 'Show nearby station'
                })
            );
            $('.show_nearby_station_cb').before(new_sns_cb);

            $('#id_show_nearby_station_cb').change(function() {
                if(this.checked) {
                    $('.show_nearby_station_cb input').click();
                } else {
                    $('.show_nearby_station_cb input').click();
                }
            });
            show_near_stt_top = parseInt($('.flags_control_col').css('height')) + 35 + 'px'
            $('.bk-show-nearby-station-cb').css('top', show_near_stt_top)

            window.top.postMessage({
                'signal': 'on-ready',
                'params': 'continue',
            }, '*');                        // to main_renderer.js
        }
    }

};