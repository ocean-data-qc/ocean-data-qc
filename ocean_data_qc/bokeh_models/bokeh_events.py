# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from bokeh.models.widgets.buttons import Button
from bokeh.models.callbacks import Callback
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.widgets.markups import Div
from bokeh.models.widgets import Slider, CheckboxGroup
from bokeh.models.callbacks import CustomJS
from bokeh.layouts import gridplot
from bokeh.models.widgets.panels import Panel, Tabs

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *


class BokehEvents(Environment):
    ''' Controls and events. The widgets and buttons are created here
        Also some other events and triggers such as update points selections
    '''
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH EVENTS')
        self.env.bk_events = self

        self.env.source.selected.on_change('indices', self._update_selection)
        self.env.wmts_map_source.selected.on_change('indices', self._update_map_selection)

        self._init_cb_prof_invsbl_points()
        self._init_profile_nav()
        self._init_nearby_prof_cb()
        self._init_tabs()

    def _update_selection(self, attr, old, new_indices):
        ''' This is run when some elements are selected:
                @attr: 'selected'
                @old: >> does not work well yet with the new Selection class?
                @new: >> new_indices store the new selection indices list
        '''
        lg.info('-- UPDATE SELECTION: {}'.format(new_indices))
        self.env.dt_manual_update = False
        if self.env.selection != new_indices and new_indices != []:
            self.env.selection = new_indices
            self.env.sample_to_select = None      # this is reselected later on `_upd_prof_srcs`
            self.env.stt_to_select = None
            self.env.cur_nearby_prof = None
            self.env.cur_partial_stt_selection = []

            self._update_map_selection_prog(new_indices)
            self.env.bk_table.update_dt_source()  # prof sources is updated inside
            self.env.reset_selection = False
        elif self.env.selection != [] and new_indices == []:
            # NOTE: Keeps the selection when the user click on a space without any sample
            if self.env.reset_selection:
                lg.info('>> RESET SELECTION')
                self.env.selection = []
                self.env.sample_to_select = None      # this is reselected later on `_upd_prof_srcs`
                self.env.stt_to_select = None
                self.env.cur_nearby_prof = None
                self.env.cur_partial_stt_selection = []
                self.env.reset_selection = False
            else:
                lg.info('>> KEEP SELECTION')
                self.env.source.selected.indices = self.env.selection   # keep selection
        self.env.dt_manual_update = True  # reactivate the manual update of the datatable

    def _update_map_selection(self, attr, old, new_indices):
        lg.info('-- UPDATE MAP SELECTION')
        if self.env.map_selection != new_indices and new_indices != []:  # this can be triggered by the user, and programmatically??
            lg.info('>> NEW MAP SELECTION: {}'.format(new_indices))
            self.env.map_selection = new_indices

            # triggers the _update_selection
            # lg.info('>> MAP SOURCE: {}'.format(self.env.wmts_map_source.data))
            selected_stts = list(self.env.wmts_map_source.data[STNNBR][new_indices])
            # self.env.cur_partial_stt_selection = selected_stts

            # TODO: how to get all the indices of the current selected stations?? by self.env.cds_df is updated??
            sel_inds = list(self.env.cds_df[self.env.cds_df[STNNBR].isin(selected_stts)].index)

            self.env.source.selected.indices = sel_inds
            self._update_selection(
                attr='selected',
                old=None,
                new_indices=self.env.source.selected.indices  # I need to trigger this manually as well
            )

        elif self.env.map_selection != [] and new_indices == []:
            if self.env.reset_selection:
                lg.info('>> RESET MAP SELECTION')
                self.env.map_selection = []
                self.env.wmts_map_source.selected.indices = []
            else:
                lg.info('>> KEEP MAP SELECTION')
                self.env.wmts_map_source.selected.indices = self.env.map_selection

    def _update_map_selection_prog(self, new_indices):
        ''' Updates the map selection programmatically with the stations of the selected samples
                @new_indices: list of indices of the selected samples (cds_df)
        '''
        lg.info('-- UPDATE MAP SELECTION PROGRAMMATICALLY')
        if self.env.map_selection != new_indices and new_indices != []:  # this can be triggered by the user, and programmatically??
            stt_to_select = list(self.env.cds_df.loc[new_indices, STNNBR])
            indices_to_select = list(self.env.wmts_map_df[self.env.wmts_map_df[STNNBR].isin(stt_to_select)].index)
            self.env.map_selection = indices_to_select
            self.env.wmts_map_source.selected.indices = indices_to_select
        elif self.env.map_selection != [] and new_indices == []:
            if self.env.reset_selection:
                lg.info('>> RESET MAP SELECTION')
                self.env.map_selection = []
                self.env.wmts_map_source.selected.indices = []

    def _init_cb_prof_invsbl_points(self):
        ''' Plot the profiles with the visible points or with the invisible as well
        '''
        def on_click_cb_prof_invsbl_points(active_list):
            if active_list == [0]:
                self.env.plot_prof_invsbl_points = True
            else:
                self.env.plot_prof_invsbl_points = False
            self.env.bk_sources._upd_prof_srcs()

        self.cb_prof_invsbl_points = CheckboxGroup(
            width=200, height=10,
            labels=['Fixed profiles'],  # Plot invisible points on profiles
            active=[],
            css_classes=['fixed_profiles_cb', 'bokeh_hidden']
        )
        self.cb_prof_invsbl_points.on_click(on_click_cb_prof_invsbl_points)

    def _init_profile_nav(self):
        def next_profile():
            if self.nearby_prof_cb:
                lg.info('-- NEXT PROFILE')
                s = self.env.stations
                next_pos = s.index(self.env.cur_nearby_prof) + 1
                if next_pos < len(self.env.stations):
                    if s[next_pos] == self.env.stt_to_select:
                        next_pos = next_pos + 1
                if next_pos < len(self.env.stations):
                    self.env.cur_nearby_prof = s[next_pos]
                    self.env.bk_sources._upd_prof_srcs(force_selection=True)
                    self.nearby_prof_div.text = str(int(self.env.cur_nearby_prof))

                    # adjust disabled buttons
                    if next_pos + 1 == len(self.env.stations):
                        self.next_prof_bt.disabled = True
                    self.previous_prof_bt.disabled = False

        def previous_profile():
            lg.info('-- PREVIOUS PROFILE')
            if self.nearby_prof_cb:
                s = self.env.stations
                previous_pos = s.index(self.env.cur_nearby_prof) - 1
                if previous_pos >= 0:
                    if s[previous_pos] == self.env.stt_to_select:
                        previous_pos = previous_pos - 1
                if previous_pos >= 0:
                    self.env.cur_nearby_prof = s[previous_pos]
                    self.env.bk_sources._upd_prof_srcs(force_selection=True)
                    self.nearby_prof_div.text = str(int(self.env.cur_nearby_prof))

                    # adjust disabled buttons
                    if previous_pos == 0:
                        self.previous_prof_bt.disabled = True
                    self.next_prof_bt.disabled = False

        self.next_prof_bt = Button(
            width=30, disabled=True,
            label=">", button_type="success",
        )
        self.nearby_prof_div = Div(
            width=100, height=30,
            text='None', css_classes=['cur_stt'],
        )
        self.previous_prof_bt = Button(
            width=30, disabled=True,
            label="<", button_type="success",

        )
        self.next_prof_bt.on_click(next_profile)
        self.previous_prof_bt.on_click(previous_profile)

    def _init_nearby_prof_cb(self):
        def on_click_nearby_prof(active_list):
            lg.info('-- ONCLICK NEARBY PROF')
            lg.info('>> SELECTED STT: {}'.format(self.env.stt_to_select))
            if 0 in active_list:
                self.env.plot_nearby_prof = True
                self.set_cur_nearby_prof()
                self.env.bk_sources._upd_prof_srcs(force_selection=True)
            else:
                self.env.plot_nearby_prof = False
                self.next_prof_bt.disabled = True
                self.previous_prof_bt.disabled = True
                self.env.cur_nearby_prof = None
                self.nearby_prof_div.text = 'None'
                self.env.bk_sources._upd_prof_srcs(force_selection=True)

        self.nearby_prof_cb = CheckboxGroup(
            width=200, height=20,
            labels=['Show nearby station'],
            active=[],
            css_classes=['show_nearby_station_cb', 'bokeh_hidden']
        )
        self.nearby_prof_cb.on_click(on_click_nearby_prof)

    def set_cur_nearby_prof(self):
        lg.info('-- SET CUR NEARBY PROF')
        self.next_prof_bt.disabled = False          # TODO: if the database has only one station?
        self.previous_prof_bt.disabled = False

        # NOTE: get the default extra station: the next one if exists
        #       if not, the previous one
        if self.env.stt_to_select is not None:
            next_pos = self.env.stations.index(self.env.stt_to_select) + 1
            if next_pos < len(self.env.stations):
                self.env.cur_nearby_prof = self.env.stations[next_pos]
                self.nearby_prof_div.text = str(int(self.env.cur_nearby_prof))
            else:
                previous_pos = self.env.stations.index(self.env.stt_to_select) - 1
                if previous_pos >= 0:
                    self.env.cur_nearby_prof = self.env.stations[previous_pos]
                    self.nearby_prof_div.text = str(int(self.env.cur_nearby_prof))

    def _init_tabs(self):
        lg.info('-- INIT TABS')
        panel_list = []
        # lg.info('>> self.env.TABS_FLAGS_PLOTS: {}'.format(self.env.tabs_flags_plots))
        SORT_TABS = False
        if SORT_TABS:
            ordered_tab_list = sorted(self.env.tabs_flags_plots)
        else:
            ordered_tab_list = list(self.env.tabs_flags_plots.keys())
        self.env.cur_tab = ordered_tab_list[0]              # self.env.cur_tab initialization
        self.env.cur_flag = self.env.cur_tab + FLAG_END     # self.env.cur_tab initialization

        ly_settings = self.env.f_handler.get_layout_settings()
        for tab in ordered_tab_list:
            indices = self.env.tabs_flags_plots[tab]['plots']
            children = [x.plot for x in self.env.bk_plots if x.n_plot in indices]
            # lg.info('>> CHILDREN: {}'.format(children))
            gp = gridplot(
                children=children,
                ncols=ly_settings['ncols'],
                plot_width=ly_settings['plot_width'],     # if 350 then the points are blurred
                plot_height=ly_settings['plot_height'],
                toolbar_location='left',  # TODO: separate the toolbars to set some tools active by default,
                                          #       like this the hover icon can be shown as well
            )
            name = 'panel_{}'.format(tab.lower())
            panel_list.append(Panel(
                name='panel_{}'.format(tab.lower()),
                child=gp,
                title=tab,
            ))  # TODO: closable=True

        lg.info('>> TABS WIDGET: {}'.format(self.env.tabs_widget))
        if self.env.tabs_widget is None:
            self.env.tabs_widget = Tabs(
                name='tabs_widget',
                tabs=panel_list,
                width=1250,
            )
        else:
            self.env.tabs_widget.tabs.clear()
            self.env.tabs_widget.tabs = panel_list

        def update_active_tab(attr, old, new):
            lg.info('-- UPDATE ACTIVE TAB | OLD: {} | NEW: {}'.format(old, new))
            self.env.cur_tab = self.env.tabs_widget.tabs[new].title
            lg.info('>> CUR TAB: {}'.format(self.env.cur_tab))
            flag = self.env.tabs_flags_plots[self.env.cur_tab]['flag']
            if self.env.flagger_select.value != flag:
                self.env.tab_change = True
                self.env.flagger_select.value = flag        # if they concide the update of the select is not triggered

        self.env.tabs_widget.on_change('active', update_active_tab)