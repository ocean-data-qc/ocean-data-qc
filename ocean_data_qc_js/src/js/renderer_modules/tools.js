// //////////////////////////////////////////////////////////////////////
//  License, authors, contributors and copyright information at:       //
//  AUTHORS and LICENSE files at the root folder of this application   //
// //////////////////////////////////////////////////////////////////////

"use strict";

const path = require('path');
const app_module_path = require('app-module-path');
app_module_path.addPath(__dirname);

const lg = require('logging');
const loc = require('locations');


module.exports = {

    /* DEPRECATED: use show_modal instead */
    showModal: function (type, msg='', title='', callback=false, code=''){
        // Show a modal window with a simple message. Arguments:
        //      * type: posible values 'ERROR', 'WARNING', 'INFO', 'other title'
        //      * msg: message to show in the modal form
        //      * [title]: customized title
        //      * [callback]: callback function to run after the dialog is closed

        var self = this;
        var url = path.join(loc.modals, 'modal_message.html');
        self.load_modal(url, function() {
            var modal = $('#modal_message');
            switch (type) {
                case 'ERROR':
                    modal.find('.modal-title').css('color', '#a94442');   // TODO: assign a class and set the color in the class
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                case 'INFO':
                    modal.find('.modal-title').css('color', '#5FBA7D');
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-info-circle');
                    break;
                case 'WARNING':
                    modal.find('.modal-title').css('color', '#fd7e14');
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                }


            if (title != '') {
                modal.find('.modal-title-text').text(title);
            } else {
                modal.find('.modal-title-text').text(type);
            }

            if (msg != '') {
                modal.find('.modal-body').append(
                    $('<p>', { text : msg })
                );
            }
            if (code != '') {
                modal.find('.modal-dialog').addClass('modal-lg');
                modal.find('.modal-body').append(
                    $('<pre>', { text : code })
                );
            }

            if (callback != false) {
                $('#modal_message_close').click(callback);
            }
            $('#modal_message_trigger').click();
        });
    },

    show_modal: function (params={}){
        // Show a modal window with a simple message. Arguments:
        //      * type: posible values 'ERROR', 'WARNING', 'INFO', 'other title'
        //      * msg: message to show in the modal form
        //      * [title]: customized title
        //      * [callback]: callback function to run after the dialog is closed

        var self = this;
        lg.info('-- NEW SHOW MODAL >> PARAMS: ' + JSON.stringify(params, null, 4));

        var type = '';
        if ('type' in params) {
            type = params['type'];
        }
        var msg = '';
        if ('msg' in params) {
            msg = params['msg'];
        }
        var title = '';
        if ('title' in params) {
            title = params['title'];
        }
        var callback = false;
        if ('callback' in params) {
           callback = params['callback'];
        }
        var code = '';
        if ('code' in params) {
            code = params['code'];
        }

        var url = path.join(loc.modals, 'modal_message.html');
        self.load_modal(url, function() {
            var modal = $('#modal_message');
            switch (type.toUpperCase()) {
                case 'ERROR':
                    modal.find('.modal-title').css('color', '#a94442');   // TODO: assign a class and set the color in the class
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                case 'UNCAUGHT EXCEPTION':
                    modal.find('.modal-title').css('color', '#a94442');   // TODO: assign a class and set the color in the class
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                case 'VALIDATION ERROR':
                    modal.find('.modal-title').css('color', '#a94442');   // TODO: assign a class and set the color in the class
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                case 'INFO':
                    modal.find('.modal-title').css('color', '#5FBA7D');
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-info-circle');
                    break;
                case 'WARNING':
                    modal.find('.modal-title').css('color', '#fd7e14');
                    modal.find('.modal-title-icon').removeClass().addClass('fa fa-exclamation-triangle');
                    break;
                }


            if (title != '') {
                modal.find('.modal-title-text').text(title);
            } else {
                modal.find('.modal-title-text').text(type);
            }

            if (msg != '') {
                modal.find('.modal-body').append(
                    $('<p>', { text : msg })
                );
            }
            if (code != '') {
                modal.find('.modal-dialog').addClass('modal-lg');
                modal.find('.modal-body').append(
                    $('<pre>', { text : code })
                );
            }

            if (callback != false) {
                $('#modal_message_close').click(callback);
            }
            $('#modal_message_trigger').click();
        });
    },

    call_promise: function(params={}) {
        /* The params argument should be something like this
                params = {
                        'object': 'data',
                        'method': 'method_name',
                        'args': {}
                }

                OK    > returns the requested information or a modal message with the error
                      > I suggest to return "false" for manual error
                ERROR > returns null and a modal message is shown
        */
        self = this;
        return new Promise((resolve, reject) => {
            var message = {
                'object': params.object,
                'method': params.method,
                'args': params.args,
                'bridge_text_id': $("#bokeh_iframe").contents().find(".bridge_text input").attr('id')
            }
            document.getElementById('bokeh_iframe').contentWindow.postMessage({
                "signal": "call-python-promise",
                "message_data": message
            } , '*');  // to index.html, the click on the button is run there as well

            var wait_python_response = setInterval(() => {
                if (typeof($('body').data('python_response')) !== 'undefined') {
                    lg.info('~~ CLEAR INTERVAL RESPONSE PYTHON')
                    clearInterval(wait_python_response);
                    resolve($('body').data('python_response'));
                    $('body').removeData('python_response');
                }
                if (typeof($('body').data('python_error')) !== 'undefined') {
                    lg.info('~~ CLEAR INTERVAL WITH ERROR')
                    clearInterval(wait_python_response);
                    resolve(null);
                    self.showModal('ERROR','', 'Uncaught Exception', false, $('body').data('python_error'))
                    $('body').removeData('python_error');
                }
            }, 100);
        });
    },

    multi_modal_fix: function(on_close_callback=false) {
        // This has to be run in the parent modal windows and in the children as well
        // TODO: Look for a better fix, because the fade animation is not working well

        $(document).on('show.bs.modal', '.modal', function () {
            var zIndex = 1040 + (10 * $('.modal:visible').length);
            $(this).css('z-index', zIndex);
            setTimeout(function() {
                $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
            }, 0);
        });

        $(document).on('hidden.bs.modal', '.modal', function () {
            $('.modal:visible').length && $(document.body).addClass('modal-open');
            $(this).prev().remove();
            $(this).remove();
        });

    },

    load_modal: (url, callback=false) => {
        // I have read this on SO, but I do not know what are the "intermediate steps":
        // >> So for the purpose of getting partial HTML content from the server & inserting it into the DOM,
        // >> load is a better method than the get method, as the developer does not need to worry about
        // >> handling huge data & various intermediate steps that the load function does before
        // >> fetching & before inserting the content.
        // https://stackoverflow.com/questions/1246137/ajax-jquery-load-versus-jquery-get

        $.get(url, function(data) {
            $(data).prependTo('body');
            if (callback != false) {
                callback();
            }
        });
    },

    question: function(args) {
        // Show a modal form with a question (Thge possible answer is "Yes" or "No")
        // args = {
        //     'msg': 'modal message',
        //     'title': 'modal title',
        //     'calback_yes': callback_yes,
        //     'calback_no': callback_no,
        //     'self': self,                    // this should be used only if the callback function need it to work
        // }

        var self = this;
        var url = path.join(loc.modals, 'modal_question.html');
        self.load_modal(url, function() {
            if (typeof(args.msg) === 'undefined') {
                args['msg'] = '';
            }
            if (typeof(args.title) === 'undefined') {
                args['title'] = '';
            }
            if (typeof(args.callback_yes) === 'undefined') {
                args['callback_yes'] = false; // do nothing
            }
            if (typeof(args.callback_no) === 'undefined') {
                args['callback_no'] = false;
            }

            // ICON
            $('#modal_question .modal-title').css('color', '#f0ad4e');
            $('#modal_question .modal-title-icon').removeClass().addClass('fa fa-question-circle');

            // INFO
            $('#modal_question_content').html(args.msg);
            $('#modal_question .modal-title-text').text(args.title);

            $('#modal_yes').on('click', function() {
                if (args.callback_yes != false && typeof(args.callback_yes) === 'function') {
                    if ('self' in args) {
                        args.callback_yes(args.self);
                    } else {
                        args.callback_yes();    // this is better, more isolated
                    }
                }
            });

            $('#modal_no').on('click', function() {
                if (args.callback_no != false && typeof(args.callback_no) === 'function') {
                    args.callback_no();
                }
            });
            $('#modal_trigger_modal_question_form').click();
        });
    },

    show_snackbar: function(msg='') {
        lg.info('-- SHOW SNACKBAR');
        var x = document.getElementById("snackbar");
        x.innerHTML = msg;
        x.className = "show";
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 6000);
    },

    js_call: function(args={}) {
        /*  This function is executed when a JavaScript function should be called from Python
            Call structure:
                args = {
                    'object': 'object.name',
                    'function': 'method_name',
                    'params': ['arg1', 'arg2']
                }

            Note: I could use bind as an alternative here
            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
        */
        var self = this;
        var o = null;
        if ('object' in args) {
            if (args.object == 'tools') {
                o = self;
            }
        }
        if ('function' in args) {
            if ('params' in args) {
                o[args['function']].apply(o, args['params']);
            } else {
                o[args['function']].apply(o);
            }
        }
    },

    show_wait_cursor:  function() {
        // TODO: set a with maximum time (to avoid asyncronous issues)
        lg.info('>> SET CURSOR STYLE TO WAIT');
        $('#loader_mask').removeAttr('hidden');
    },

    show_default_cursor:  function() {
        lg.info('>> SET CURSOR STYLE TO DEFAULT');
        $('#loader_mask').attr('hidden', '');
    },

    /** Convert a url "file:///C/..." to the path syntax "C:/..." */
    file_to_path: function(fileUrl=false) {
        // TODO: check if some modification is necessary on linux and mac

        var p = new URL(fileUrl).pathname;
        if (process.platform === 'win32') {
            if (p.charAt(0) === '/') {
                p = p.substr(1);
            }
        }
        p = path.join(p, '');
        return p;
    },
}
