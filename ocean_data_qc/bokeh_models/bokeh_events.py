# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from bokeh.models.widgets.buttons import Button
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.widgets.markups import Div
from bokeh.models.widgets import Slider, CheckboxGroup, Select
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
        lg.info(f'-- UPDATE SELECTION | NEW: {new_indices} | SELF.ENV.SELECTION: {self.env.selection}')
        self.env.dt_manual_update = False
        if self.env.selection != new_indices and new_indices != []:
            lg.info('>> NEW SELECTION')
            self.env.selection = new_indices
            self.env.sample_to_select = None      # this is reselected later on `_upd_prof_srcs`
            self.env.stt_to_select = None
            self.env.cur_nearby_prof = None
            self.env.cur_partial_stt_selection = []
            self._update_map_selection_prog(new_indices)
            self._nearby_prof_select_remove_on_change()
            self.env.bk_table.update_dt_source()  # prof sources is updated inside
            if self.env.plot_nearby_prof:
                self._update_nearby_prof_select_opts()
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
                if self.env.plot_nearby_prof:
                    self._reset_nearby_prof_select_opts()
                self.env.reset_selection = False
            else:
                lg.info('>> KEEP SELECTION')
                self.env.source.selected.indices = self.env.selection   # keep selection
        elif self.env.selection == [] and new_indices == []:  # in case deselect_tool is run
            if self.env.plot_nearby_prof:
                self._reset_nearby_prof_select_opts()

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
            lg.info('-- NEXT PROFILE')
            if self.nearby_prof_cb:
                s = self.nearby_prof_select.options
                next_pos = s.index(f'{self.env.cur_nearby_prof}') + 1
                if next_pos < len(s):
                    self.nearby_prof_select.value = s[next_pos]
                    self.env.cur_nearby_prof = float(s[next_pos])
                    if (self.env.cur_nearby_prof).is_integer():
                        self.env.cur_nearby_prof = int(self.env.cur_nearby_prof)

        def previous_profile():
            lg.info('-- PREVIOUS PROFILE')
            if self.nearby_prof_cb:
                s = self.nearby_prof_select.options
                previous_pos = s.index(f'{self.env.cur_nearby_prof}') - 1
                if previous_pos >= 0:
                    self.nearby_prof_select.value = s[previous_pos]
                    self.env.cur_nearby_prof = float(s[previous_pos])
                    if (self.env.cur_nearby_prof).is_integer():
                        self.env.cur_nearby_prof = int(self.env.cur_nearby_prof)

        self.next_prof_bt = Button(
            width=30, disabled=True,
            label=">", button_type="success",
        )
        self.nearby_prof_select = Select(
            width=80, value=None,
            options=['None'],
            css_classes=['nearby_prof_select'],
            disabled=True,
        )
        self.previous_prof_bt = Button(
            width=30, disabled=True,
            label="<", button_type="success",
        )
        self.next_prof_bt.on_click(next_profile)
        self.previous_prof_bt.on_click(previous_profile)

    def _on_change_nearby_prof_select(self, attr, old, new):
        lg.info('-- ON CHANGE NEARBY PROF SELECT')
        # TODO: dont trigger this the first time
        if isinstance(self.env.stt_to_select, int):  # str to number >> to make it work with '2.2' or '2'
            new_value = int(new)
        elif isinstance(self.env.stt_to_select, float):
            new_value = float(new)
        else: # string
            new_value = new

        s = self.env.stations
        new_pos = s.index(new_value)
        self.env.cur_nearby_prof = s[new_pos]

        # NOTE: trigger this just in case there is a manual change
        self.env.bk_sources._upd_prof_srcs(force_selection=True)
        self._check_profile_limits()

    def _check_profile_limits(self):
        ''' Disable previous and next buttons when the station selected in in the limit or
            when the checkbox of showing nearby station is not ticked
        '''
        lg.info('-- CHECK PROFILE LIMITS')
        if self.nearby_prof_select.options == ['None'] or len(self.nearby_prof_select.options) == 1:
            self.previous_prof_bt.disabled = True
            self.next_prof_bt.disabled = True
            return
        if self.nearby_prof_select.value == self.nearby_prof_select.options[-1]:
            self.next_prof_bt.disabled = True
        else:
            self.next_prof_bt.disabled = False

        if self.nearby_prof_select.value == self.nearby_prof_select.options[0]:
            self.previous_prof_bt.disabled = True
        else:
            self.previous_prof_bt.disabled = False

    def _nearby_prof_select_remove_on_change(self):
        lg.info('-- NEARBY PROF SELECT REMOVE ON CHANGE')
        try:
            self.nearby_prof_select.remove_on_change('value', self._on_change_nearby_prof_select)
        except Exception as e:
            lg.warning('Select callback could not be removed')

    def _reset_nearby_prof_select_opts(self):
        ''' Removes callback when the onchange method in the dropdown is triggeres
            Disable navigation buttons and remove option values in the select widget
        '''
        lg.info(f'-- RESET NEARBY PROF SELECT OPTS')
        self._nearby_prof_select_remove_on_change()
        self.nearby_prof_select.options = ['None']
        self.nearby_prof_select.disabled = True
        self.next_prof_bt.disabled = True
        self.previous_prof_bt.disabled = True

    def _update_nearby_prof_select_opts(self):
        lg.info(f'-- UPDATE NEARBY PROF SELECT OPTS | STT TO SELECT: {self.env.stt_to_select}')
        to_sort = True
        for e in self.env.stations:
            if isinstance(e, str):
                to_sort = False
        if to_sort:  # sort only if all the values are integer or float
            options_sorted = sorted(self.env.stations)
        else:
            options_sorted = self.env.stations

        if self.env.stt_to_select is not None:
            options_sorted.remove(self.env.stt_to_select)
            self.nearby_prof_select.options = [f'{s}' for s in options_sorted]
            self.nearby_prof_select.on_change('value', self._on_change_nearby_prof_select)
            self.nearby_prof_select.disabled = False
            self._check_profile_limits()

    def _init_nearby_prof_cb(self):
        def on_click_nearby_prof(active_list):
            lg.info('-- ONCLICK NEARBY PROF')
            lg.info('>> SELECTED STT: {}'.format(self.env.stt_to_select))
            if 0 in active_list:
                self.env.plot_nearby_prof = True
                if self.env.stt_to_select is not None:
                    self.set_cur_nearby_prof()
                    self.env.bk_sources._upd_prof_srcs(force_selection=True)
                    self._update_nearby_prof_select_opts()
            else:
                self.env.plot_nearby_prof = False
                self._nearby_prof_select_remove_on_change()
                self.nearby_prof_select.options = ['None']
                self.nearby_prof_select.disabled = True
                self.next_prof_bt.disabled = True
                self.previous_prof_bt.disabled = True
                self.env.cur_nearby_prof = None
                self.env.bk_sources._upd_prof_srcs(force_selection=True)

        self.nearby_prof_cb = CheckboxGroup(
            width=200, height=20,
            labels=['Show nearby station'],
            active=[],
            css_classes=['show_nearby_station_cb', 'bokeh_hidden']
        )
        self.nearby_prof_cb.on_click(on_click_nearby_prof)

    def set_cur_nearby_prof(self):
        ''' Stores in self.env.cur_nearby_prof the default extra station.
            The next one if it exists, if not, the previous one
        '''
        lg.info('-- SET CUR NEARBY PROF')
        self.next_prof_bt.disabled = False
        self.previous_prof_bt.disabled = False
        if self.env.stt_to_select is not None:
            nearby_pos = self.env.stations.index(self.env.stt_to_select)
            if nearby_pos < len(self.env.stations) - 1:
                self.env.cur_nearby_prof = self.env.stations[nearby_pos + 1]
                self.nearby_prof_select.value = f'{self.env.cur_nearby_prof}'
            else:
                nearby_pos = nearby_pos - 1
                if nearby_pos >= 0:
                    self.env.cur_nearby_prof = self.env.stations[nearby_pos]
                    self.nearby_prof_select.value = f'{self.env.cur_nearby_prof}'
            self._check_profile_limits()

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


