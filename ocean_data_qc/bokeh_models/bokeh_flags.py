# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from bokeh.models.widgets.buttons import Button
from bokeh.models.widgets.markups import Div
from bokeh.models.widgets import Select
from bokeh.layouts import row, column
import numpy as np

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *
import traceback


class BokehFlags(Environment):
    ''' Class to manage Flag Controls and its Events
    '''
    env = Environment

    @property
    def all_flags_list(self):
        # NOTE: current available flags on the CDS plus flags with 0 elements
        return sorted([i for i, fg_str in self.env.all_flags.items()])

        # TODO: If you want to assign a new flag value out of this list,
        #       a mechanism to add a new value should be added

    def __init__(self, **kwargs):
        self.env.bk_flags = self
        self.env.visible_flags = self.all_flags_list
        self.all_flags_vb_bt = None
        self.flags_control_header_row = None
        self.flag_rows = []

        self._init_flagger_select()
        self._init_flags_control_header()
        self._init_flags_control_table()

    def _init_flagger_select(self):
        lg.info('-- INIT FLAGGER SELECT')
        options = self.env.cruise_data.get_cols_by_type(['param_flag', 'qc_param_flag'])
        options = sorted(options)
        self.env.flagger_select = Select(
            value=self.env.cur_flag,
            options=options,
            css_classes=['flagger_select'],
        )

        def update_select_flag_value(attr, old, new):
            lg.info('-- SELECT VALUE | OLD: {} | NEW: {}'.format(old, new))
            self.env.cur_flag = new
            if self.env.tab_change:
                self.env.tab_change = False
            else:
                lg.info('-- SELECT CHANGE')
                self.env.bk_bridge.call_js({
                    'object': 'tools',
                    'function': 'show_wait_cursor',
                })
                self.env.tabs_flags_plots[self.env.cur_tab]['flag'] = new

                # TODO: replot of all the colors of the tab
                #       some of the glyphs could be invisible
                #       only an indices update is needed

                cur_plot_list = self.env.tabs_flags_plots[self.env.cur_tab]['plots']
                self.env.doc.hold('collect')
                self.env.bk_plots_handler.replot_color_circles(only_cur_tab=True)
                self.env.bk_sources.update_prof_sources()  # TODO: keep the selection as it is >> keep_selection = True
                                                           #       I do this here because some point could be invisible for
                                                           #       other tab
                self.env.doc.unhold()
                self.env.bk_bridge.call_js({
                    'object': 'tools',
                    'function': 'show_default_cursor',
                })

        self.env.flagger_select.on_change('value', update_select_flag_value)

    def  _init_flags_control_header(self):
        lg.info('-- FLAGS CONTROL HEADER')
        self.all_flags_vb_bt = Button(
            name='all_flags_bt',
            label='',
            width=30,
            css_classes=['eye_bt'],
        )

        def all_flags_vb_bt_callback():
            lg.info('-- ALL FLAGS VISIBLE CALLBACK')
            self.env.bk_bridge.call_js({
                'object': 'tools',
                'function': 'show_wait_cursor',
            })
            all_flags_bt = self.env.doc.select_one(dict(
                name='all_flags_bt'
            ))
            eye_slash_bt = True if 'eye_slash_bt' in all_flags_bt.css_classes else False
            if eye_slash_bt:
                self.env.doc.set_select(
                    selector=dict(tags=['vb_bt']),
                    updates=dict(css_classes=['eye_bt'])
                )
            else:
                self.env.doc.set_select(
                    selector=dict(tags=['vb_bt']),
                    updates=dict(css_classes=['eye_slash_bt'])
                )

            new_visible_flags = []
            if 'eye_bt' in all_flags_bt.css_classes:
                all_flags_bt.css_classes = ['eye_slash_bt']
            else:
                new_visible_flags = self.all_flags_list
                all_flags_bt.css_classes = ['eye_bt']
            lg.info('>> NEW VISIBLE FLAGS: {}'.format(new_visible_flags))
            self._update_visible_flags(new_visible_flags)
            self.env.bk_bridge.call_js({
                'object': 'tools',
                'function': 'show_default_cursor',
            })


        self.all_flags_vb_bt.on_click(all_flags_vb_bt_callback)

        # TODO: replace this div with the flag selection dropdown
        #       or maybe there would be too many control on one place

        flag_controls_title_div = Div(
            name='flag_controls_title',
            text='All the flags',
            width=100,
            height=25,
            css_classes=['flag_controls_title'],
        )

        self.flags_control_header_row = row(
            children=[
                self.all_flags_vb_bt,
                flag_controls_title_div
            ],
            width=200,
            height=25,
        )

    def _init_flags_control_table(self):
        ''' Reminder:
                self.env.all_flags = {
                    2: 'FLAG 2',
                    3: 'FLAG 3',
                    ...
                }
        '''
        lg.info('-- INIT FLAGS CONTROL TABLE')
        # lg.info('-- ALL FLAGS DICTIONARY: {}'.format(self.env.all_flags))

        for flag_index, str_value in self.env.all_flags.items():

            def change_flag_vb(flag_index=flag_index):
                self.env.bk_bridge.call_js({
                    'object': 'tools',
                    'function': 'show_wait_cursor',
                })
                vb_bt_to_change = self.env.doc.select_one(dict(
                    name='flag_vb_bt_{}'.format(flag_index)
                ))
                lg.info('>> CHANGING VISIBILITY: {}'.format('flag_vb_bt_{}'.format(flag_index)))

                new_visible_flags = self.env.visible_flags.copy()
                if 'eye_bt' in vb_bt_to_change.css_classes:
                    new_visible_flags.remove(flag_index)
                    vb_bt_to_change.css_classes = ['eye_slash_bt']
                else:
                    new_visible_flags.append(flag_index)
                    vb_bt_to_change.css_classes = ['eye_bt']
                self._update_visible_flags(new_visible_flags)
                self.env.bk_bridge.call_js({
                    'object': 'tools',
                    'function': 'show_default_cursor',
                })

            vb_bt = Button(
                name='flag_vb_bt_{}'.format(flag_index),
                label='',
                width=30,
                tags=['vb_bt'],
                css_classes=['eye_bt'],
            )
            vb_bt.on_click(change_flag_vb)

            edit_flag_bt = self._init_edit_bt(flag_index)

            fg_str_div = Div(
                name='fg_str_div_{}'.format(flag_index),
                text='{}'.format(str_value),
                width=100,
                height=25,
                tags=['fg_str_div'],
                css_classes=['fg_str_div'],
                style={
                    'color': CIRCLE_COLORS[flag_index],
                    'font-weight': 'bold',
                }
            )

            flag_row = row(
                name='flag_row_{}'.format(flag_index),
                children=[vb_bt, edit_flag_bt, fg_str_div],
                width=200,
                height=25,
            )

            # self.env.flag_vb_bts.append(vb_bt)
            self.flag_rows.append(flag_row)

        self.env.flags_control_col = column(
            name='flags_control_col',
            children=[self.flags_control_header_row] + self.flag_rows,
            css_classes=['flags_control_col'],
        )

    def _init_edit_bt(self, flag_index):
        edit_flag_bt = Button(
            name='edit_flag_bt_{}'.format(flag_index),
            label='',
            width=30,
            tags=['edit_flag_bt'],
            css_classes=['edit_flag_bt']
        )
        def update_flag_value_edit_bt(flag_index=flag_index):
            self.update_flag_value(
                flag_value=flag_index,
                flag_to_update=None,
                row_indexes=self.env.selection
            )
        edit_flag_bt.on_click(update_flag_value_edit_bt)
        return edit_flag_bt

    def update_flag_value(self, flag_value=None, flag_to_update=None, row_indexes=[]):
        lg.info('-- UPDATE FLAG VALUE')
        self.env.bk_bridge.call_js({
            'object': 'tools',
            'function': 'show_wait_cursor',
        })
        if flag_value is None:
            lg.error('>> An empty flag value got to `self.env.bk_flags.update_flag_value()`')
        if flag_to_update is None:
            flag_to_update = self.env.cur_flag
        if row_indexes == []:
            lg.error('>> NO row_indexes selected')

        self.env.cruise_data.update_flag_values(
            column=flag_to_update,
            new_flag_value=flag_value,
            row_indices=row_indexes,
        )
        new_values = np.array(self.env.source.data[flag_to_update], dtype=int)  # TODO: Int8 or Int64
        new_values[row_indexes] = flag_value
        self.env.source.data[flag_to_update] = new_values
        self.env.bk_sources.cds_df[flag_to_update] = new_values

        # Updating flag colors
        self.env.doc.hold('collect')
        self.env.bk_plots_handler.replot_color_circles()

        # NOTE: update datatable and prof sources is needed because the new flag could be invisible,
        #       then the profiles should be invisible as well
        # self.env.bk_table.update_dt_source()
        self.env.bk_sources.update_prof_sources(force_selection=True)

        self.env.doc.unhold()

        self.env.bk_bridge.call_js({
            'object': 'tools',
            'function': 'show_default_cursor',
        })
        self.env.bk_bridge.call_js({
            'object': 'tools',
            'function': 'show_snackbar',
            'params': ['{} values of {} updated with the flag value {}'.format(
                len(row_indexes),
                flag_to_update,
                flag_value,
            )],
        })

    def _update_visible_flags(self, to_visible_flags=[]):
        ''' Makes visible the flags passed as argument, and make invisible the rest
                @to_visible_flags: all the visible (or to make visible) flags indices
        '''
        lg.info('-- UPDATE VISIBLE FLAGS')

        to_visible = []
        to_invisible = []
        for flag_index, flag_str in self.env.all_flags.items():
            if flag_index in self.env.visible_flags and flag_index not in to_visible_flags:
                to_invisible.append('GR_FLAG_{}'.format(flag_index))
            if flag_index not in self.env.visible_flags and flag_index in to_visible_flags:
                to_visible.append('GR_FLAG_{}'.format(flag_index))

        lg.info('>> TO VISIBLE FLAGS: {}'.format(to_visible_flags))
        lg.info('>> TO VISIBLE: {}'.format(to_visible))
        lg.info('>> TO INVISIBLE: {}'.format(to_invisible))

        self.env.doc.hold('collect')
        if to_visible != []:
            self.env.doc.set_select(
                selector=dict(tags=to_visible),
                updates=dict(visible=True)
            )
        if to_invisible != []:
            self.env.doc.set_select(
                selector=dict(tags=to_invisible),
                updates=dict(visible=False)
            )

        all_flags_bt = self.env.doc.select_one(dict(
            name='all_flags_bt'
        ))
        if to_visible_flags == []:
            all_flags_bt.css_classes = ['eye_slash_bt']
        else:
            all_flags_bt.css_classes = ['eye_bt']

        self.env.visible_flags = to_visible_flags.copy()
        self.env.bk_sources.update_prof_sources(force_selection=True)
        self.env.doc.unhold()

    def reset_all_flags(self):
        lg.info('-- RESET ALL FLAGS')
        if sorted(self.env.visible_flags) != self.all_flags_list:
            self.env.doc.set_select(
                selector=dict(tags=['vb_bt']),
                updates=dict(css_classes=['eye_bt'])
            )

            to_visible = []
            for flag_index, flag_str in self.env.all_flags.items():
                if flag_index not in self.env.visible_flags:
                    to_visible.append('GR_FLAG_{}'.format(flag_index))

            self.env.doc.set_select(
                selector=dict(tags=to_visible),
                updates=dict(visible=True)
            )
            self.env.visible_flags = self.all_flags_list

            all_flags_bt = self.env.doc.select_one(dict(
                name='all_flags_bt'
            ))
            all_flags_bt.css_classes = ['eye_bt']
