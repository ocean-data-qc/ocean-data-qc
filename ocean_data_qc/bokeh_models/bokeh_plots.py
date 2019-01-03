# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import numpy as np
from copy import deepcopy
from bokeh.plotting import figure
from bokeh.models.sources import ColumnDataSource, CDSView
from bokeh.models.filters import GroupFilter, BooleanFilter, IndexFilter
from bokeh.events import Reset, DoubleTap
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.callbacks import CustomJS
from bokeh.models.glyphs import Line
from bokeh.models.markers import Circle, Asterisk
from bokeh.palettes import Reds3
from bokeh.models.tools import (
    PanTool, BoxZoomTool, BoxSelectTool, WheelZoomTool,
    LassoSelectTool, CrosshairTool, TapTool, SaveTool, ResetTool,
    HoverTool
)
from bokeh.io import curdoc
from bokeh.util.logconfig import bokeh_logger as lg

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *


class BokehPlots(Environment):
    env = Environment

    def __init__(self, **kwargs):
        self.env.doc = curdoc()     # TODO: replace bk with env

        if 'x' in kwargs:
            self.x = kwargs['x']
        if 'y' in kwargs:
            self.y = kwargs['y']
        if 'title' in kwargs:
            self.title = kwargs['title']
        if 'n_plot' in kwargs:
            self.n_plot = kwargs['n_plot']
        if 'tab' in kwargs:
            self.tab = kwargs['tab']    # TODO: is it needed?

        # this plot will be added to a loop to create the grids
        # self.glyph_rends = []       # GlyphRenderers (Circle Renderers)

        self.plot = None            # plot initialization, should be this a list of plots? or use this class for each plot?
        self.circles = []
        self.asterisk = None
        self.asterisk_cds = None
        self.lasso_select = None

        self._init_figure()
        self._init_color_circles()
        self._init_profile_lines()
        self._init_profile_lines_circles()
        self._init_asterisk()
        self._set_tools()
        self._set_events()

    def _init_figure(self):
        title = None
        if self.env.show_titles:
            title = self.title
        self.plot = figure(
            # name='silcat_vs_nitrat',     # TODO: build a unique name here?
            # width=600,                   # NOTE: the size is given in the gridplot
            # height=600,
            x_range=self.env.ranges[self.x]['x_range'],
            y_range=self.env.ranges[self.y]['y_range'],
            x_axis_label=self.x,
            y_axis_label=self.y,
            toolbar_location=None,
            tools='',
            title=title,
            output_backend=OUTPUT_BACKEND,

            border_fill_color='whitesmoke',       # TODO: this should be declared on the yaml file
            background_fill_color='whitesmoke',
        )
        self.plot.yaxis.axis_label_text_font_style = 'normal'
        self.plot.xaxis.axis_label_text_font_style = 'normal'

    def _init_color_circles(self):
        ''' Plot different circles depending on their flag
            All the flags should be plotted in all the plots,
            even if they do not have the right flag (self.env.all_flags)
        '''
        for key in self.env.all_flags:  # TODO: set some order (overlapping layers)
            # TODO: Waiting for the GroupFilter by numeric value https://github.com/bokeh/bokeh/issues/7524

            c = self.plot.circle(
                x=self.x,
                y=self.y,
                size=4,
                line_color=None,
                fill_color=CIRCLE_COLORS[key],
                # fill_alpha=0.6,         # to see overlapping points??
                source=self.env.source,
                view=self.env.flag_views[self.tab][key],

                nonselection_line_color=None,
                nonselection_fill_color=CIRCLE_COLORS[key],
                nonselection_fill_alpha=1.0,
            )
            c.selection_glyph = Circle(
                line_color=Reds3[0],
                line_alpha=1.0,
                fill_color='yellow',
            )
            c.tags = ['GR_FLAG_{}'.format(key), 'GR_FLAG']
            self.circles.append(c)

    def _init_profile_lines(self):
        ''' This is just a initialization of the Line GlyphRenderers.

            If some selected point are on the same profile, only one should be drawn

            Note: the line profiles cannot be plotted with CDSViews because if the indexes are
                  not consecutive then the line is not going to be only one line.
        '''
        self.ml_prof_line = self.plot.multi_line(
            xs='xs{}'.format(self.n_plot),
            ys='ys{}'.format(self.n_plot),
            source=self.env.ml_source,
            color='colors',
            line_cap='round',
            line_join='round',
            line_width='line_width',
        )

    def _init_profile_lines_circles(self):
        ''' This plots the vertexes of the line, the small cloud of points.
            Two glyphs are plotted:
                * Selected points
                * Non-selected points
        '''
        lg.info('-- INIT PROFILE LINES CIRCLES')
        self.env.profile_colors = [BLUES[i] for i in range(NPROF - 1)]
        self.env.profile_colors.reverse()
        self.env.profile_colors = self.env.profile_colors + [RED]
        # profile colors = [..., light blue, blue, dark blue, red]
        for i in range(NPROF):
            color = self.env.profile_colors[i]
            c = self.plot.circle(
                x='{}_{}_{}'.format(self.tab, self.x, i),
                y='{}_{}_{}'.format(self.tab, self.y, i),
                line_color=color,
                fill_color=color,
                size=4,             # this attr is common for the selection and non-selection glyph
                source=self.env.pc_source,

                nonselection_line_color=color,
                nonselection_fill_color=color,
                nonselection_line_alpha=1.0,
                nonselection_fill_alpha=1.0
            )
            c.selection_glyph = Circle(
                line_color=RED,
                fill_color='yellow',
                line_alpha=1.0,
                fill_alpha=1.0
            )

    def _init_asterisk(self):
        ''' The asterisk is the mark for the current selected sample
                * self.asterisk - red asterisk on the background
                * self.aux_asterisk_asterisk - marked asterisk
                * self.aux_asteris_circle - center asterisk marked
        '''
        self.asterisk = self.plot.asterisk(
            x='{}_{}'.format(self.tab, self.x),
            y='{}_{}'.format(self.tab, self.y),
            size=20,
            line_color=Reds3[0],
            line_width=3,
            source=self.env.asterisk_source,
        )
        # NOTE: The following object is to avoid a shadow for a
        #       few ms when a new selection is made
        self.asterisk.nonselection_glyph = Asterisk(
            line_color=None, fill_color=None,
            line_alpha=0.0, fill_alpha=0.0
        )

        self.aux_asterisk = self.plot.asterisk(
            x='{}_{}'.format(self.tab, self.x),
            y='{}_{}'.format(self.tab, self.y),
            size=17,
            line_color='yellow',
            line_width=1,
            source=self.env.asterisk_source,
        )
        self.aux_asterisk.nonselection_glyph = Asterisk(
            line_color=None, fill_color=None,
            line_alpha=0.0, fill_alpha=0.0
        )

        self.aux_asterisk_circle = self.plot.circle(
            x='{}_{}'.format(self.tab, self.x),
            y='{}_{}'.format(self.tab, self.y),
            size=5,
            fill_color='yellow',
            line_width=None,
            source=self.env.asterisk_source,
        )
        self.aux_asterisk_circle.nonselection_glyph = Circle(
            line_color=None, fill_color=None,
            line_alpha=0.0, fill_alpha=0.0
        )

    @property
    def flag(self):
        return self.env.tabs_flags_plots[self.tab]['flag']

    def _reset_plot(self, event):
        ''' This method should be assigned to all the plots to reset the zoom level and location
                * Hides all the Line GlyphRenderers on the plot.
                * The selection is also removed
                * The flag visibility is reset
        '''
        # TODO: the zoom reset id run only for the gridplot on the current tab, how to run it on the rest of the plots?
        lg.info('-- RESET PLOT: {}'.format(self.n_plot))
        self.env.doc.hold('collect')
        if self.env.selection != []:
            self.env.reset_selection = True  # this does not work anymore
            self.env.selection = []
            self.env.cur_partial_stt_selection = []  # in order to triger the partial selection method
            self.env.dt_manual_update = False
            self.env.bk_table.update_dt_source()
            self.env.dt_manual_update = True

            self.env.map_selection = []
            self.env.wmts_map_source.selected.indices = []

        self.env.bk_flags.reset_all_flags()
        self.env.doc.unhold()

    def _double_tap_event(self, event):
        ''' This could be useful to change the axis variables
            or some other plot attributes
        '''
        lg.info('-- DOUBLE TAP EVENT, AXIS: {} | {}'.format(self.x, self.y))

    def _set_events(self):
        self.plot.on_event(DoubleTap, self._double_tap_event)
        self.plot.on_event(Reset, self._reset_plot)

    def _set_tools(self):
        wheel_zoom = WheelZoomTool()
        pan = PanTool()
        box_zoom = BoxZoomTool()
        box_select = BoxSelectTool()
        crosshair = CrosshairTool()
        tap = TapTool()
        save = SaveTool()
        reset = ResetTool()     # TODO: add only to one plot, maybe with n_plot

        self.lasso_select = LassoSelectTool(
            renderers=self.circles,                  # default all available renderers
            select_every_mousemove=False,            # enhance performance
        )

        tooltips = '''
            <style>
                .bk-tooltip>div:not(:nth-child(-n+5)) {{
                    display:none;
                }}

                /* .bk-tooltip-custom + .bk-tooltip-custom {{
                    display: none;  sometimes everything is hidden with this
                }} */

                .bk-tooltip>div {{
                    background-color: #dff0d8;
                    padding: 5px;
                }}
            </style>

            <b>INDEX: </b> @INDEX <br>
            <b>{x}: </b> @{x} <br>
            <b>{x}_FLAG_W: </b> @{x}_FLAG_W <br>
            <b>{y}: </b> @{y} <br>
            <b>{y}_FLAG_W: </b> @{y}_FLAG_W <br>
        '''.format(x=self.x, y=self.y)

        hover = HoverTool(                  # TODO: try to make this toggleable
            renderers=self.circles,
            toggleable=True,
            mode='mouse',
            tooltips=tooltips,
        )

        tools = (
            pan, box_zoom, self.lasso_select, box_select,
            crosshair, save, reset, tap, wheel_zoom
        )
        self.plot.add_tools(*tools)
