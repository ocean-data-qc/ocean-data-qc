# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.data_models.exceptions import ValidationError
from bokeh.io import curdoc
from bokeh.plotting import figure
from bokeh.models.sources import ColumnDataSource
from bokeh.models.callbacks import CustomJS
from bokeh.models.widgets import Button, TextInput
from bokeh.layouts import widgetbox, row, layout
from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *
import json
import os
import traceback


class ElectronBokehBridge(Environment):
    ''' This class is used to exchange messages from bokeh server and Electron
    '''
    env = Environment

    bridge_plot = None
    bridge_text = None
    bridge_button = None
    bridge_box = None
    bridge_plot_callback = None

    def __init__(self):
        lg.info('-- MESSAGES BRIDGE')
        self.env.bk_bridge = self

        self._init_bridge_plot()
        self._init_bridge_button()
        self._init_curdoc()
        self._save_pid()

    def _init_bridge_plot(self):
        lg.info('-- INIT BRIDGE PLOT')
        self.bridge_plot = figure(
            plot_width=200,
            plot_height=200,
        )
        self.bridge_plot.css_classes = ['bridge_plot']
        source = ColumnDataSource({
            'x': [1, 2, 3],
            'y': [4, 5, 6],
        })
        self.bridge_trigger = self.bridge_plot.scatter(
            x='x', y='y', source=source,
            size=1, color="navy", alpha=0.5
        )
        self.bridge_plot_callback = CustomJS(code="""
            // This content will be overwritten by the method run_js_code()
        """)
        self.bridge_trigger.glyph.js_on_change('size', self.bridge_plot_callback)

    def _init_bridge_button(self):
        ''' Creates dummy objects to trigger and send messages between electron and bokeh '''

        self.bridge_button = Button(
            label='Bridge Button',
            button_type='success',
        )
        self.bridge_button.css_classes = ['bridge_button']
        self.bridge_button.on_click(self.send_python_response)  # api retrocompatibility?

        self.bridge_text = TextInput(
            name='bridge_text_input'
        )
        self.bridge_text.css_classes = ['bridge_text']

    def _init_curdoc(self):
        self.bridge_box = widgetbox(
            width=300,
            children=[
                self.bridge_text,
                self.bridge_button,
            ],
            sizing_mode='fixed'
        )
        self.env.bridge_row = row(
            name='bridge_row',
            children=[self.bridge_plot, self.bridge_box, ]
        )
        self.env.bridge_row.css_classes = ['bridge_row']

        self.env.doc = curdoc()
        self.env.doc.add_root(self.env.bridge_row)

    def send_python_response(self):
        """ Build the response to send back to JavaScript

            @message = {
                'object': '',
                'method': '',
                'args': {}
            }
        """
        lg.info('-- PYTHON RESPONSE')
        message = json.loads(self.bridge_text.value)  # TODO: check if this works or if

        obj = message.get('object', False)
        method_str = message.get('method', False)
        args = message.get('args', False)
        if obj is False or method_str is False:
            self.run_js_code(
                signal='python-error',
                params='OBJ or METHOD variables should exist and be assined'
            )
            return

        lg.info('>> OBJ: {} | METHOD: {} | ARGS: {}'.format(obj, method_str, args))

        # TODO: try to return the object directly with eval, instead of creating an elif for each model
        if obj == 'cruise.data':
            method = getattr(self.env.cruise_data, method_str)
        elif obj == 'cruise.data.handler':
            method = getattr(self.env.cd_handler, method_str)
        elif obj == 'bokeh.loader':
            method = getattr(self.env.bk_loader, method_str)
        elif obj == 'computed.parameter':
            method = getattr(self.env.cruise_data.cp_param, method_str)
        elif obj == 'files.handler':
            method = getattr(self.env.f_handler, method_str)
        # elif obj == 'computed.parameter':
        #     method = getattr(self.plot.cruisedata.cp, method)

        result = False
        try:
            if args is not False and method is not False:
                result = method(args)
            else:
                result = method()
        except Exception as e:
            if isinstance(e, ValidationError):  # no traceback is needed
                self.error_js(str(e), err_type='Validation Error')  # to remove the apostrophes on both sides
            else:
                trace = traceback.format_exc()
                lg.exception('')  # the traceback is printed here
                self.run_js_code(
                    signal='python-error',
                    params=trace
                )
        else:
            self.run_js_code(
                signal='python-response',
                params=result
            )

    def run_js_code(self, signal, params={}):
        """ General method to run JavaScript inside the iframe
            The signal is sent to the bokeh_renderer.js file
            TODO: they are developing a better way to run JavaScript directly
        """
        if params != {}:
            params = json.dumps(params, sort_keys=True)
        if len(params) < 5000:
            lg.info('>> RUN JS CODE, PARAMS: {}'.format(params))
        else:
            lg.warning('>> Very long string in params')
        lg.info('>> SIGNAL: {}'.format(signal))
        js_code = """
            window.top.postMessage({{
                'signal': '{}',
                'params': {}
            }}, '*');                        // to main_renderer.js
        """.format(signal, params)
        # lg.info('>> JS CODE: {}'.format(js_code))
        self.bridge_plot_callback.code = js_code
        self.bridge_trigger.glyph.size += 1  # triggers the callback

    def call_js(self, params={}):
        """ General method to run JavaScript code from python
            The signal is sent to the main_renderer.js file
            and calls the 'js_call' method in the tools.js file
        """
        if params != {}:
            params = json.dumps(params, sort_keys=True)
        lg.info('>> CALL JS PARAMS: {}'.format(params))
        signal = 'js-call'
        js_code = """
            window.top.postMessage({{
                'signal': '{}',
                'params': {},
            }}, '*');                        // to main_renderer.js
        """.format(signal, params)
        self.bridge_plot_callback.code = js_code
        self.bridge_trigger.glyph.size += 1  # triggers the callback

    def error_js(self, msg='', err_type='Error'):
        self.call_js({
            'object': 'tools',
            'function': 'show_modal',
            'params': [{
                'type': err_type,
                'msg': msg,
            }]
        })

    def _save_pid(self):
        """ The Process ID is saved in the shared_data.json file """

        lg.info('-- SAVE PYTHON PID')
        with open(SHARED_DATA, 'r') as shared_data_read:
            json_config = json.load(shared_data_read)
        json_config['python_pid'] = int(os.getpid())
        with open(SHARED_DATA, 'w') as shared_data_write:
            json.dump(
                json_config,
                shared_data_write,
                indent=4,
                sort_keys=True
            )

    def show_default_cursor(self):
        self.call_js({
            'object': 'tools',
            'function': 'show_default_cursor',
        })

    def show_wait_cursor(self):
        self.call_js({
            'object': 'tools',
            'function': 'show_wait_cursor',
        })