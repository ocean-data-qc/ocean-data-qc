# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.bokeh_models.bokeh_sources import BokehSources
from ocean_data_qc.env import Environment
from ocean_data_qc.bokeh_models.bokeh_plots_handler import BokehPlotsHandler
from ocean_data_qc.bokeh_models.bokeh_table import BokehDataTable
from ocean_data_qc.bokeh_models.bokeh_flags import BokehFlags
from ocean_data_qc.bokeh_models.bokeh_events import BokehEvents
from ocean_data_qc.bokeh_models.bokeh_map import BokehMap
from ocean_data_qc.bokeh_models.bokeh_layout import BokehLayout

from ocean_data_qc.data_models.cruise_data import CruiseData
from ocean_data_qc.data_models.cruise_data_handler import CruiseDataHandler
from ocean_data_qc.data_models.electron_bokeh_bridge import ElectronBokehBridge

from bokeh.layouts import column
from bokeh.models.layouts import Spacer


class BokehLoader(Environment):
    ''' This class is used for: 
            * load the bokeh form for the first time
            * reload the bokeh form
            * reload parts of the bokeh form
    '''
    env = Environment

    def __init__(self):
        lg.info('-- INIT BOKEH LOADER')
        self.env.bk_loader = self
        self.env.tabs_widget_col = column(
            name='tabs_widget_col',
            children=[Spacer()]
        )
        self.env.doc.add_root(self.env.tabs_widget_col)
        self.env.sidebar = column(
            name='sidebar_col',
            width=250,
            children=[Spacer()],
            css_classes=['sidebar_col'],
        )
        self.env.doc.add_root(self.env.sidebar)

        # TODO: Add plot styles from the theme.yaml file

        # curdoc().theme = Theme(json=yaml.load("""
        # attrs:
        #    DataTable:
        #        text_font_size: 8pt
        # """))

    def init_bokeh(self):
        BokehSources()
        self.env.bk_sources.load_data()
        BokehPlotsHandler()
        BokehDataTable()
        BokehEvents()
        BokehFlags()
        BokehMap()
        BokehLayout()

    def reset_bokeh(self):
        ''' Reset the layout values in order to close the project '''
        lg.info('-- RESET VALUES ON THE FORM (> SPACERS)')

        # The problem is >> I can update only the children of elements
        # So the main form elements should have children >> a row or column for instance
        # Keep the bridge row
        tabs_widget_col = self.env.doc.select_one(dict(name='tabs_widget_col'))
        tabs_widget_col.children.clear()
        tabs_widget_col.children.append(Spacer())

        sidebar_col = self.env.doc.select_one(dict(name='sidebar_col'))
        sidebar_col.children.clear()
        sidebar_col.children.append(Spacer())

        self.reset_environment()

    def reset_environment(self):
        lg.info('-- RESET ENVIRONMENT')
        do_not_reset = [
            'bk_loader', 'doc', 'tabs_widget', 'sidebar', 'bk_bridge',
            'bridge_row'
        ]
        for attr in dir(self.env):
            if attr[:2] != '__':  # to exclude special methods and attributes
                if attr not in do_not_reset:
                    value = getattr(self.env, attr)
                    if isinstance(value, bool):
                        setattr(self.env, attr, False)
                    if isinstance(value, str):
                        setattr(self.env, attr, '')
                    elif isinstance(value, list):
                        setattr(self.env, attr, [])
                    elif isinstance(value, dict):
                        setattr(self.env, attr, {})
                    elif isinstance(value, int):
                        setattr(self.env, attr, 0)
                    elif isinstance(value, float):
                        setattr(self.env, attr, 0.0)
                    # elif isinstance(value, object):  # this does not work for classes?
                    #     setattr(self.env, attr, None)
                    # elif isinstance(value, Environment):
                    else:
                        setattr(self.env, attr, None)

        for attr in dir(self.env):
            if attr[:2] != '__':
                value = getattr(self.env, attr)
                lg.info('ATTR: {} | VALUE: {}'.format(attr, value))

        CruiseData()
        CruiseDataHandler()

    def reload_bokeh(self):
        lg.info('-- RELOAD BOKEH')
        self.reset_bokeh()
        self.init_bokeh()