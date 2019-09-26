# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from bokeh.models.ranges import DataRange1d, Range1d
from bokeh.models.filters import IndexFilter

from ocean_data_qc.env import Environment
from ocean_data_qc.bokeh_models.bokeh_plots import BokehPlots
from ocean_data_qc.constants import *


class BokehPlotsHandler(Environment):
    ''' The purpose of this class is to instantiate all the bokeh
        plot objects and make some operations to handle them

        The common attributes for all the plots should be instantiated here,
        or at least assign the values to the bokeh_shared_data
    '''
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH PLOTS HANDLE')
        self.env.bk_plots_handler = self

        self._init_tabs_and_plots()

    @property
    def plots(self):
        ''' Get the list of plots. More about properties:
            https://docs.python.org/2/library/functions.html#property
            This is a readonly property
        '''
        return [bp.plot for bp in self.env.bk_plots]

    @property
    def current_n_plots(self):
        ''' Return the number of plots. More about properties:
            https://docs.python.org/2/library/functions.html#property
            This is a readonly property

            NOTE: self.env.n_plots should be updated and synchronized with this property
        '''
        return len(self.env.bk_plots)

    def _init_tabs_and_plots(self):
        ''' This dictionary is created to store the flag and plots that are located in each tab

            self.env.tabs_flags_plots = {
                'NITRAT': {
                    'flag': 'NITRAT_FLAG_W',       # default flag to mark in the dropdown
                    'plots': [0, 1, 2, 3]          # plot list in order to create the gridplot
                                                   # positions in self.env.bk_plots
                },
                'SALNTY': {
                    'flag': 'SALNTY_FLAG_W',
                    'plots': [4, 5, 6]
                },

                # [...]
            }
        '''
        lg.info('-- INIT TABS LAYOUT')
        self.env.bk_sources._init_prof_circles_sources()
        self.env.bk_sources._init_flag_views()
        self._init_ranges()
        graphs = self.env.f_handler.graphs_per_tab  # property of FilesHandler object
        for tab in self.env.f_handler.tab_list:
            tab_flag = tab + FLAG_END       # TODO: tabs titles cannot be flags?
                                            #       if there is not flag available choose the first in the dropdown
            self.env.tabs_flags_plots[tab] = {
                'flag': tab_flag,
                'plots': [],
            }
            for graph in graphs[tab]:
                bp = BokehPlots(
                    x=graph.x, y=graph.y, title=graph.title,
                    n_plot=graph.pos, tab=tab,   # TODO: guess the flag with the tab?
                )

                # NOTE: this is to avoid the ranges warning, the profiles sources have no data
                #       at the begining and the ranges cannot be initiated
                # https://github.com/bokeh/bokeh/issues/6639
                bp.plot.x_range.renderers = bp.circles
                bp.plot.y_range.renderers = bp.circles

                self.env.bk_plots.append(bp)
                self.env.tabs_flags_plots[tab]['plots'].append(graph.pos)

            self.env.bk_plots[
                self.env.tabs_flags_plots[tab]['plots'][0]
            ].add_deselect_tool()

        # lg.info('>> SELF.ENV.TABS_FLAGS_PLOTS: {}'.format(self.env.tabs_flags_plots))

    def _init_ranges(self):
        lg.warning('-- INIT RANGES')
        # TODO: do no create axis for some parameters (if not needed)
        # lg.warning('>> TAB LIST: {}'.format(self.env.f_handler.tab_list))
        # for tab in self.env.f_handler.tab_list:

        for col in self.env.cur_plotted_cols:
            # gmax = self.env.cruise_data.df[col].max()
            # gmin = self.env.cruise_data.df[col].min()
            # d = gmax - gmin

            range_padding = 0.25
            x_range = DataRange1d(
                range_padding=range_padding,
                renderers=[]
            )
            y_range = DataRange1d(
                range_padding=range_padding,
                renderers=[]
            )

            # x_range = Range1d(
            #     start=gmin,                       # bounds automatically detected with DataRange1d
            #     end=gmax,
            #     # max_interval=gmax + d * p,        # zoom out limit >> useful if hovers are used
            #     # min_interval                      # zoom in limit
            # )
            # y_range = Range1d(
            #     start=gmin,                       # bounds automatically detected with DataRange1d
            #     end=gmax,
            #     # max_interval=gmax + d * p,        # zoom out limit >> useful if hovers are used
            #     # min_interval                      # zoom in limit
            # )

            # lg.info('>> COLUMN: {} | X START: {} | X END: {} | Y START: {} | Y END: {}'.format(
            #     col, gmin - d * p, gmax + d *p, gmin - d * p, gmax + d * p
            # ))

            if col not in self.ranges:
                self.env.ranges[col] = {}
                self.env.ranges[col]['x_range'] = x_range
                self.env.ranges[col]['y_range'] = y_range

    def replot_color_circles(self, only_cur_tab=False):
        '''
            The result should be something like this:

            self.env.views = {
                'TAB_NAME': {
                    0: view_object_0,
                    1: view_object_1,
                }
            }

            NOTE: self.env.all_flags and  self.env.tabs_flags_plots should be created beforehand
        '''
        lg.info('-- REPLOT COLOR CIRCLES')
        flags = {}
        for i, val in enumerate(self.env.source.data[self.env.cur_flag]):
            flags.setdefault(int(val), []).append(i)
        tabs_to_update = []
        if only_cur_tab:
            lg.info('>> UPDATE ONLY CURRENT TAB')
            tabs_to_update = [self.env.cur_tab]
        else:
            lg.info('>> UPDATE TABS WITH THE SAME FLAG')
            for tab in list(self.env.tabs_flags_plots.keys()):
                if self.env.tabs_flags_plots[tab]['flag'] == self.cur_flag:
                    tabs_to_update.append(tab)

        for tab in tabs_to_update:
            for key in list(self.env.all_flags.keys()):
                if key in flags:
                    self.env.flag_views[tab][key].filters = [IndexFilter(flags[key])]
                else:  # there is no values for the current flag
                    self.env.flag_views[tab][key].filters = [IndexFilter([])]
        # lg.info('>> SELF.ENV.FLAG_VIEWS: {}'.format(self.env.flag_views))

    def deselect_tool(self):
        self.env.reset_selection = True  # this does not work anymore
        self.env.selection = []
        self.env.source.selected.indices = []
        self.env.cur_partial_stt_selection = []  # in order to triger the partial selection method
        self.env.dt_manual_update = False
        self.env.bk_table.update_dt_source()
        self.env.dt_manual_update = True
        self.env.map_selection = []
        self.env.wmts_map_source.selected.indices = []