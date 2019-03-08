# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import numpy as np
import pandas as pd
from bokeh.models.widgets.tables import (
    DataTable, TableColumn, HTMLTemplateFormatter, StringEditor, CellEditor
)
from bokeh.models.filters import IndexFilter
from bokeh.models.sources import ColumnDataSource
from bokeh.models.widgets.buttons import Button
from bokeh.models.widgets.markups import Div

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *


class BokehDataTable(Environment):
    ''' DataTable Controls and events '''
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH DATATABLE')
        self.env.bk_table = self

        self.s = 0          # current sample
        self.ns = 0         # number of samples
        self.table_df = None
        self.update_params()

        self.flag_formatter = None
        self.value_formatter = None
        self.param_formatter = None
        self.env.dt_manual_update = True

        self._init_templates()
        self._init_datatable()
        self._init_sample_buttons()

    def _init_templates(self):
        switch_case = ''
        for c, v in CIRCLE_COLORS.items():
            switch_case += "case '{}': return('{}'); break;\n".format(str(c), v)
        flag_template="""
            <div style="font-weight: bold; color: <%=
                (function colorfromint() {{
                    switch (value) {{
                        {}
                        default: return('black');
                    }}
                }}()) %>; " ><%= value %>
            </div>
        """.format(switch_case)
        self.flag_formatter =  HTMLTemplateFormatter(template=flag_template)  # TODO: to show float numbers NumberFormatter should be used

        value_template="""
            <div style="font-weight: <%=
                (function colorfromint() {
                    switch (value) {
                        case 'NaN': return('bold'); break
                        default: return('normal');
                    }
                }()) %>; color: <%=
                (function colorfromint() {
                    switch (value) {
                        case 'NaN': return('red'); break
                        default: return('black');
                    }
                }()) %>; " ><%= value %>
            </div>
        """
        # lg.info('>> TEMPLATE: {}'.format(value_template))
        self.value_formatter =  HTMLTemplateFormatter(template=value_template)

        param_template="""
            <div style="font-weight: bold;"><%= value %></div>
        """
        # lg.info('>> TEMPLATE: {}'.format(param_template))
        self.param_formatter =  HTMLTemplateFormatter(template=param_template)

    def _init_datatable(self):
        columns = [
            TableColumn(
                width=80,
                field="parameter",
                title="Parameter",
                formatter=self.param_formatter,
                editor=CellEditor()  # non editable
            ),
            TableColumn(
                width=50,
                field="value",
                title="Value",
                formatter=self.value_formatter,
                editor=CellEditor()
            ),
            TableColumn(
                width=40,
                field="flag",
                title="Flag",
                formatter=self.flag_formatter,
                editor=StringEditor()
            ),
        ]
        self.table_df = pd.DataFrame(dict(
            parameter=self.params,
            value=[''] * len(self.params),
            flag=[''] * len(self.params),
        ))
        table_cds = ColumnDataSource(self.table_df)
        self.data_table = DataTable(
            width=190,
            height=125,
            source=table_cds,
            columns=columns,
            editable=True,                  # TODO: check if there is a better way than https://stackoverflow.com/a/49424647/4891717
            fit_columns=False,              # avoids horizontal scrolls bar
            index_position=None,            # hides index column
            selectable=True,                # this is needed to edit cells

            reorderable=False,              # NOTE: this needs jquery ui, but it is not needed
            scroll_to_selection=False,      # not needed
            sortable=False,                 # not needed
        )

        self.data_table.source.on_change('data', self.on_change_data_source)

    def _init_sample_buttons(self):
        lg.info('-- SET SAMPLE BUTTONS')

        def next_sample():
            lg.info('>> NEXT SAMPLE')
            if self.s < self.ns:
                self.env.doc.hold('collect')
                self.s += 1
                self.sample_div.text = ' {} / {}'.format(self.s, self.ns)
                self.env.cur_nearby_prof = None  # to reset the extra stt profile to plot
                self.env.dt_next_sample = True
                self._update_dt_sample()
                self.env.doc.unhold()

        def previous_sample():
            lg.info('>> PREVIOUS SAMPLE')
            if self.s > 1:
                self.env.doc.hold('collect')
                self.s -= 1
                self.sample_div.text = ' {} / {}'.format(self.s, self.ns)
                self.env.cur_nearby_prof = None
                self.env.dt_previous_sample = True
                self._update_dt_sample()
                self.env.doc.unhold()

        self.next_bt = Button(label=">", button_type="success", width=30)
        self.sample_div = Div(text='0 / 0', width=100, height=30, css_classes=['sample_div'], )
        self.previous_bt = Button(label="<", button_type="success", width=30)
        self.next_bt.on_click(next_sample)
        self.previous_bt.on_click(previous_sample)

    def update_params(self):
        self.params = self.env.cruise_data.get_cols_by_type(['param'])
        self.params.insert(0, STNNBR)

    def update_dt_source(self):
        ''' Updates the datatable source depending on the selected samples
        '''
        lg.info('-- UPDATE DATATABLE SOURCE')
        self.update_params()
        df = self.env.cds_df.iloc[self.env.selection]
        df_filter = self.env.cruise_data.get_cols_by_type(['param', 'param_flag', 'qc_param_flag'])
        df_filter.insert(0, STNNBR)
        df = df.filter(df_filter)
        self.table_df = df                          # TODO: check if it has the same order as the selection)
        self.ns = len(self.env.selection)
        self.s = 1 if self.env.selection != [] else 0
        self.sample_div.text = ' {} / {}'.format(self.s, self.ns)
        self._update_dt_sample()

    def _update_dt_sample(self):
        ''' Updates the datatable with the data of the self.s
        '''
        lg.info('-- UPDATE DT SAMPLE')
        flag_values = []
        param_values = []
        if self.s != 0:
            self.env.sample_to_select = self.env.selection[self.s - 1]

            for p in self.params:
                v = self.table_df.loc[self.env.sample_to_select, p]
                # lg.info('>> V: {} | TYPE: {}'.format(v, type(v)))
                if not isinstance(v, str):
                    if np.isnan(v):
                        v = 'NaN'
                    else:
                        v = str(v)
                param_values.append(v)

                fp = p + FLAG_END
                if fp in self.table_df.columns:
                    fv = self.table_df.loc[self.env.sample_to_select, fp]
                    if not isinstance(fv, str):
                        if np.isnan(fv):
                            fv = 'NaN'
                        else:
                            fv = str(fv)
                    flag_values.append(fv)
                else:
                    flag_values.append('-')
        else:
            self.env.sample_to_select = None
            param_values = [''] * len(self.params)
            flag_values = [''] * len(self.params)
        new_vals_dict = {
            'parameter': self.params,
            'value': param_values,
            'flag': flag_values
        }
        lg.info('>> NEW VALS DICT: \n\n{}'.format(new_vals_dict))
        lg.info('>> LENS (PARAMETER, VALUE, FLAG) = ({}, {}, {})'.format(len(self.params), len(param_values), len(flag_values)))

        lg.info('>> DT_MANUAL_UPDATE IN _UPDATE_DT_SAMPLE: {}'.format(self.env.dt_manual_update))
        # self.env.dt_manual_update = False  # just in case
        self.data_table.source.data = new_vals_dict
        # self.env.dt_manual_update = True

        self.env.bk_sources.update_prof_sources(force_selection=True)

    def on_change_data_source(self, attr, old, new):
        indices = list(range(self.table_df.size))
        # changes = [(param_name, index, old_value, new_value)]
        changes = [(self.params[i],i,j,k) for i,j,k in zip(indices, old['flag'], new['flag']) if j != k]

        # lg.info('>> CHANGES: {}'.format(changes))
        # lg.info('>> SELECTION = {} | DF_MANUAL_UPDATE = {}'.format(self.env.selection, self.env.dt_manual_update))
        # lg.info('>> DT_NEXT_SAMPLE = {} | DF_PREVIOUS_SAMPLE = {}'.format(self.env.dt_next_sample, self.env.dt_previous_sample))

        error = False

        # This happens when the DataFrame is empty (Reset button or the initial state)
        if self.env.selection == [] and self.env.dt_manual_update:
            error = True

        if self.env.selection != [] and self.env.dt_manual_update and changes != []:
            # if len(changes) == 1:  # NOTE: if it is a manual update the length should be 1
                                     #       but I am getting size 1 when the whole DataTable CDS is updated
                                     #       I do not why is this happening
            if not(self.env.dt_next_sample or self.env.dt_previous_sample):
                for t in changes:
                    if t[2] == '-':
                        error = True
                        self.env.bk_bridge.error_js(
                            'This parameter does not have any flag column associated.'
                        )
                    else:
                        try:
                            new_flag_val = int(t[3])
                        except:
                            error = True
                            self.env.bk_bridge.error_js('The value should be an integer.')
                        else:
                            if new_flag_val not in self.env.bk_flags.all_flags_list:
                                error = True
                                self.env.bk_bridge.error_js('The cell value should be a valid flag value.')
                            else:
                                self.env.dt_manual_update = False
                                self.env.bk_flags.update_flag_value(
                                    flag_to_update=t[0] + FLAG_END,
                                    flag_value=new_flag_val,
                                    row_indexes=[self.env.sample_to_select]
                                )
                                self.env.dt_manual_update = True
            else:
                self.env.dt_next_sample = False
                self.env.dt_previous_sample = False

        if error:
            self.rollback(changes)

    def rollback(self, changes):
        lg.info('-- DATATABLE ROLLBACK')
        if self.env.selection != []:
            for t in changes:
                patch = { 'flag': [(t[1], t[2]), ] }   # rollback to the old value
                self.env.dt_manual_update = False
                self.data_table.source.patch(patch)
                self.env.dt_manual_update = True
        else:
            if changes != []:
                for t in changes:
                    patch = { 'flag': [(t[1], ''), ] }     # rollback to the initial value
                    self.env.dt_manual_update = False
                    self.data_table.source.patch(patch)
                    self.env.dt_manual_update = True
            else:
                self.env.dt_manual_update = False
                self.table_df = pd.DataFrame(dict(
                    parameter=self.params,            # remove flags from here
                    value=[''] * len(self.params),
                    flag=[''] * len(self.params),
                ))
                self.data_table.source.data = self.table_df.to_dict('list')
                self.env.dt_manual_update = True
