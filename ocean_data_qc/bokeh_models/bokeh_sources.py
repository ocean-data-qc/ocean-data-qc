# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import time
import numpy as np
import pandas as pd
from bokeh.util.logconfig import bokeh_logger as lg
from bokeh.models.sources import ColumnDataSource, CDSView
from bokeh.models.filters import IndexFilter
from bokeh.palettes import Reds3

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.files_handler import FilesHandler


class BokehSources(Environment):
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH DATA')
        self.env.bk_sources = self

    def load_data(self):
        lg.info('-- LOAD DATA')
        FilesHandler()
        self._init_cds_df()
        self._init_bathymetric_map_data()
        self.env.stations = self.env.sh_cruise_data.stations
        self.env.source = ColumnDataSource(self.env.cds_df)
        self._init_prof_sources()
        self._init_asterisk_source()
        self._init_all_flag_values()

    def _init_cds_df(self):
        ''' Create integer index on the dataframe
            The main DF has hashs strings as indices, so we need to create a new index
            TODO: Should I create a multilevel index???
        '''
        if self.env.sh_cruise_data.df is None:
            self.env.sh_cruise_data.load_file()  # for AQC files
        length = len(self.env.sh_cruise_data.df.index)
        index = np.array(np.array(list(range(0,length))))
        self.env.cds_df = self.env.sh_cruise_data.df.copy(deep=True)   # TODO: copy only the columns needed, not all of them??
        self.env.cds_df['INDEX'] = index                               # NOTE: the index will coincide with the row position
        self.env.cds_df = self.env.cds_df.set_index(['INDEX'])          #       so .iloc can be used in order to get the rows

    def _epsg4326_to_epsg3857(self, lon, lat):
        x = lon * 20037508.34 / 180
        y = np.log(np.tan((90 + lat) * np.pi / 360)) / (np.pi / 180) * 20037508.34 / 180
        return(x, y)

    def _init_bathymetric_map_data(self):
        x_wm, y_wm = self._epsg4326_to_epsg3857(
            self.env.cds_df.LONGITUDE.as_matrix(),
            self.env.cds_df.LATITUDE.as_matrix()
        )
        aux_df = pd.DataFrame(dict(
            X_WMTS=x_wm,
            Y_WMTS=y_wm,
            STNNBR=list(self.env.cds_df[STNNBR])
        ))
        aux_df.drop_duplicates(subset=STNNBR, keep='first', inplace=True)
        lg.info('>> AUX DF LEN: {}'.format(aux_df.index.size))
        new_index_column = list(range(aux_df.index.size))
        lg.info('>> AUX DF new_index_column: {}'.format(len(new_index_column)))
        aux_df = aux_df.assign(NEW_INDEX=new_index_column)
        aux_df.set_index(keys='NEW_INDEX', inplace=True)
        self.env.wmts_map_df = aux_df.copy(deep=True)
        self.env.wmts_map_source = ColumnDataSource(self.env.wmts_map_df)

    def _init_flag_views(self):
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
        lg.info('-- INIT FLAG VIEWS')
        lg.info('>> SELF.ENV.ALL_FLAGS: {}'.format(self.env.all_flags))
        lg.info('>> self.env.tabs_flags_plot: {}'.format(self.env.tabs_flags_plots))

        # TODO: tabs with the same flag should share the views

        for tab in self.env.ob_files_handler.tab_list:
            flag = tab + FLAG_END
            flags = {}
            for i, val in enumerate(self.env.source.data[flag]):
                flags.setdefault(int(val), []).append(i)

            flag_views = {}
            for key in list(self.env.all_flags.keys()):
                if key in flags:
                    view = CDSView(source=self.env.source, filters=[IndexFilter(flags[key])])
                else:  # there is no values
                    view = CDSView(source=self.env.source, filters=[IndexFilter([])])
                flag_views[key] = view
            self.env.flag_views[tab] = flag_views

        # lg.info('>> SELF.ENV.FLAG_VIEWS: {}'.format(self.env.flag_views))


    def _init_prof_circles_sources(self):
        ''' Creates a CDS for the profile points. So the column names:
                NITRAT_SALTNY_5:
                    * NITRAT >> Tab where the plot is drawn
                    * SALTNY >> Column data
                    * 5      >> Station number: (0, 1, 2, 3, 4 or 5) for NPROF = 6
        '''
        lg.info('-- INIT PROF CIRCLES SOURCES')
        d = {}
        compound_cols = []
        # lg.info('>> TABS FLAGS PLOTS: {}'.format(self.env.tabs_flags_plots))
        graphs = self.env.ob_files_handler.graphs_per_tab
        for tab in self.env.ob_files_handler.tab_list:
            for graph in graphs[tab]:

            # for col in self.env.cds_df.columns.tolist():  # TODO: not all of them
                for i in range(NPROF):
                    compound_cols.append('{}_{}_{}'.format(tab, graph.x, i))
                    compound_cols.append('{}_{}_{}'.format(tab, graph.y, i))
        compound_cols = list(set(compound_cols))
        if compound_cols != []:
            d = dict.fromkeys(compound_cols, [])
        self.env.pc_source = ColumnDataSource(d)

    def _init_prof_sources(self):
        ''' Multiline ColumnDataSource Initialization '''
        colors = []
        line_width = []
        init_ml_profs = []

        # VIEWS
        for i in range(NPROF - 1, -1, -1):
            if i == NPROF - 1:          # TODO: add this to the CDS
                colors.append(Reds3[0])
                line_width.append(3)
            else:
                colors.append(BLUES[i])
                line_width.append(2)
            init_ml_profs.append([])

        # ML SOURCE
        init_source_dict = dict(colors=colors, line_width=line_width)
        for i in range(self.env.n_plots):
            init_source_dict['xs{}'.format(i)] = init_ml_profs
            init_source_dict['ys{}'.format(i)] = init_ml_profs
        self.env.ml_source = ColumnDataSource(data=init_source_dict)

    def _init_asterisk_source(self):
        lg.info('-- INIT ASTERISK SOURCE')
        d = {}
        compound_cols = []
        graphs = self.env.ob_files_handler.graphs_per_tab
        for tab in self.env.ob_files_handler.tab_list:
            for graph in graphs[tab]:
                compound_cols.append('{}_{}'.format(tab, graph.x))
                compound_cols.append('{}_{}'.format(tab, graph.y))
        compound_cols = list(set(compound_cols))
        if compound_cols != []:
            d = dict.fromkeys(compound_cols, [])
        lg.info('>> ASTERISK SOURCE COLUMNS: {}'.format(compound_cols))
        self.env.asterisk_source = ColumnDataSource(d)

    def _init_all_flag_values(self):
        ''' Set all the possible flag values. Generates a dictionary like this:
            self.env.all_flags = {
                2: 'FLAG 2',
                3: 'FLAG 3',
                ...
            }
        '''
        cols = self.env.sh_cruise_data.all_params_flags
        flag_vals = self.env.cds_df[cols].values.ravel('K')  # ravel('K') to flatten the multidimensional array
        flag_vals = flag_vals[~np.isnan(flag_vals)]          # remove nan
        flag_vals = np.unique(flag_vals)                     # select the unique values
        flag_vals = flag_vals.astype(np.int64)               # convert to integer
        flag_vals = flag_vals.tolist()                       # convert to python list

        # forcing the basic values
        # TODO: Create a flag form in order to set the flag values by hand
        if 2 not in flag_vals:
            flag_vals.append(2)
        if 3 not in flag_vals:
            flag_vals.append(3)
        if 4 not in flag_vals:
            flag_vals.append(4)
        flag_vals = sorted(flag_vals)

        for f in flag_vals:
            self.env.all_flags[f] = 'Flag {}'.format(f)
        lg.info('>> INIT ALL FLAG VALUES: {}'.format(self.env.all_flags))
        if len(flag_vals)>len(CIRCLE_COLORS):
            for f in flag_vals:
                if f > 9:
                    CIRCLE_COLORS.update({f:CIRCLE_COLORS[9]})

    def update_prof_sources(self, force_selection=False):
        ''' Selects the points of the profile line and update the multiline data source
            and asterisks and circles views
                @force_selection: a new partial selection should be done from scratch

            NOTE: This method should be the most efficient
        '''
        lg.info('-- UPDATE PROF SOURCES')
        start = time.time()
        if self.env.cur_partial_stt_selection == [] or force_selection:
            self._set_partial_stt_selection()  # len(partial_stt_selection) <= NPROF
        df_fs = None
        stt_order = []
        if self.env.cur_partial_stt_selection != []:
            ml_df = pd.DataFrame(index=self.env.cur_partial_stt_selection, columns=[])
            df_fs = self.env.cds_df[self.env.cds_df[STNNBR].isin(self.env.cur_partial_stt_selection)]

            # lg.info('>> DF_FS: \n\n{}\n\n'.format(df_fs))

            for bp in self.env.bk_plots:
                df_p =  df_fs[df_fs[bp.x].notnull() & df_fs[bp.y].notnull()].sort_values(['CTDPRS'], ascending=[True])

                # TODO: if one of the axis is CTDPRS then it gives an error here
                #       because the column is duplicated

                if self.env.plot_prof_invsbl_points is False:
                    df_p = df_p[df_p[bp.flag].isin(self.env.visible_flags)]

                if df_p.index.size >= 1:
                    ml_df['xs{}'.format(bp.n_plot)] = df_p.groupby(STNNBR).apply(lambda x: list(x[bp.x]))
                    ml_df['ys{}'.format(bp.n_plot)] = df_p.groupby(STNNBR).apply(lambda x: list(x[bp.y]))
                else:
                    ml_df['xs{}'.format(bp.n_plot)] = [[''] for x in self.env.cur_partial_stt_selection]
                    ml_df['ys{}'.format(bp.n_plot)] = [[''] for x in self.env.cur_partial_stt_selection]

            if ml_df.index.size >= 1:
                # NOTE: Moves the current selected station row to the end of the DF
                stt_order = ml_df.index.drop(self.env.stt_to_select).tolist() + [self.env.stt_to_select]
                ml_df = ml_df.reindex(stt_order)

                # NOTE: This converts NaN to [''] (to keep colors order, it is maybe a bokeh bug?).
                #       I do this here because if not I get the error: 'Cannot do inplace boolean setting on mixed-types with a non np.nan value'
                #       If I replace by [np.nan] this error appears: Out of range float values are not JSON compliant
                # ml_df[ml_df.isnull()] = ml_df[ml_df.isnull()].applymap(lambda x: [''])
                ml_df = ml_df.applymap(lambda x: x if isinstance(x, list) else [''])

                # lg.info('\n\n>> ML_DF:\n\n{}'.format(ml_df))

                stt_colors = self.env.profile_colors[-len(stt_order):]
                ml_df['colors'] = stt_colors        # [light blue, normal blue, darker blue, red]
                ml_df['line_width'] = [2] * (len(stt_order) - 1) + [3]

                ml_cds = ColumnDataSource(ml_df)
                self.env.ml_source.data = ml_cds.data
            else:
                self._reset_ml_source()
        else:
            self._reset_ml_source()

        self._update_prof_circle_sources(df_fs, stt_order)
        end = time.time()
        lg.info('>> ALGORITHM TIME: {}'.format(end - start))   # about 0.30 ms

    def _set_partial_stt_selection(self):
        ''' Selects the first NPROF points with different stations
            in order to plot the profile lines
                @return list with non-duplicated stations
        '''
        lg.info('-- SET PARTIAL STT SELECTION')
        df = self.env.cds_df.filter([self.env.cur_flag])     # filter by flag column
        df = df.iloc[self.env.selection]                    # filter by selected points

        # if not self.env.plot_prof_invsbl_points:
        #     df = df[df[self.env.cur_flag].isin(self.env.visible_flags)]  # filter by visible points

        visible_selection = list(df.index.values)
        self.env.stt_to_select = None
        self.env.cur_partial_stt_selection = []
        if visible_selection != []:
            if self.env.sample_to_select is None:
                self.env.sample_to_select = visible_selection[0]
            self.env.stt_to_select = self.env.cds_df.iloc[[self.env.sample_to_select]][STNNBR].values[0]  # iloc or loc??? they coincide in this case I think
            self.env.cur_partial_stt_selection.append(self.env.stt_to_select)  # TODO: more than one station may be selected

            if self.env.plot_nearby_prof:
                if self.env.cur_nearby_prof is None:
                    self.env.bk_events.set_cur_nearby_prof()  # stt_to_select is already updated
                                                             # this should be run only when there is a new selection or sample change
                self.env.cur_partial_stt_selection.append(self.env.cur_nearby_prof)  # cur_nearby_prof is always different from stt_to_select
            else:
                # NPROF - 1 because I do not count the red profile >> why???
                i = 0
                while len(self.env.cur_partial_stt_selection) < (NPROF - 1) and i < len(visible_selection):
                    stt = self.env.cds_df.iloc[[visible_selection[i]]][STNNBR].values[0]
                    if stt not in self.env.cur_partial_stt_selection:
                        self.env.cur_partial_stt_selection.append(stt)
                    i += 1

        lg.info('>> SAMPLE TO SELECT: {}'.format(self.env.sample_to_select))
        lg.info('>> STT TO SELECT: {}'.format(self.env.stt_to_select))
        lg.info('>> PARTIAL STT SELECTION: {}'.format(self.env.cur_partial_stt_selection))
        lg.info('>> CUR NEARBY PROF: {}'.format(self.env.cur_nearby_prof))
        lg.info('>> TOTAL SELECTION: {}'.format(self.env.selection))
        lg.info('>> VISIBLE SELECTION (the first one is selected): {}'.format(visible_selection))

    def _update_prof_circle_sources(self, df_fs=None, stt_order=[]):
        ''' Update the self.env.pc_source in order to mark the selected samples
            on all the plots.

            @df_fs: DF with data only with the current stations to show
            @stt_order: selected stations, red color at the end of the list
        '''
        lg.info('-- UPDATE PROFILE CIRCLE SOURCES')
        current_plotted_cols, prof_df = self._get_empty_prof_df()

        # TODO: stt_order should have more than one station if they are actually selected in the map

        # TODO: Improve the performance of this algorithm, maybe using groupby instead of loops

        # BUILDING THE NEW PROF_DF
        stt_order_reversed = list(reversed(stt_order))
        # lg.warning('>> STT ORDER REVERSED: {}'.format(stt_order_reversed))

        for tab in self.env.ob_files_handler.tab_list:
            for col in current_plotted_cols:
                i = NPROF - 1
                for stt in stt_order_reversed:
                    df_aux = df_fs[(df_fs[STNNBR] == stt) & df_fs[col].notnull()]
                    if self.env.plot_prof_invsbl_points is False:
                        flag = self.env.tabs_flags_plots[tab]['flag']
                        df_aux = df_aux[df_aux[flag].isin(self.env.visible_flags)]
                    prof_df.loc[df_aux.index.values, '{}_{}_{}'.format(tab, col, i)] = df_aux[col]

                    # lg.warning('>> STT: {} | COL: {} | I: {}'.format(stt, col, i))
                    i -= 1
        prof_df.dropna(how='all', inplace=True)
        prof_cds = ColumnDataSource(prof_df)
        self.env.pc_source.data = prof_cds.data

        # NOTE: this translates the selection indices into positional indices
        #       bokeh with each ColumnDataSource uses a new index with consecutive integers [0, 1, 2, 3, ...]
        #       it doesn´t matter if you have a different index in the DF that you use to create the CDS
        sel = []
        for i in self.env.selection:   # TODO: only selected points within profiles
            if i in prof_df.index:
                sel.append(prof_df.index.get_loc(i))
        self.env.pc_source.selected.indices = sel
        self._update_asterisk_source(current_plotted_cols)

    def _get_empty_prof_df(self):
        ''' DF initialization with empty values '''

        lg.info('-- GET EMPTY PROF DF')
        compound_cols = []
        current_plotted_cols = []
        for tab in self.env.ob_files_handler.tab_list:
            plot_indices = self.env.tabs_flags_plots[tab]['plots']
            aux_cols = []
            for pi in plot_indices:
                aux_cols.append(self.env.bk_plots[pi].x)
                aux_cols.append(self.env.bk_plots[pi].y)
            aux_cols = list(set(aux_cols))  # removes duplicates
            # lg.info('>> AUX COLS: {}'.format(aux_cols))
            current_plotted_cols.extend(aux_cols)
            for col in aux_cols:  # TODO: not all of them
                for n in range(NPROF):
                    compound_cols.append('{}_{}_{}'.format(tab, col, n))
        compound_cols.sort()
        current_plotted_cols = list(set(current_plotted_cols))

        d = {}
        if compound_cols != []:
            d = dict.fromkeys(compound_cols, [])
        prof_df = pd.DataFrame(d)  # init empty columns
        prof_df['INDEX'] = self.env.cds_df.index.values
        prof_df = prof_df.set_index(['INDEX'])

        return current_plotted_cols, prof_df

    def _update_asterisk_source(self, current_plotted_cols):
        ''' Update views for the profile circles.
                * Resets views that are not used with the current selection
                * Updates the asterisk view (selected sample)

            NOTE: Be careful with this method because the lists orders is very important
                  and dificult to follow
        '''
        lg.info('-- UPDATE ASTERISK SOURCE')

        if self.env.sample_to_select is not None:
            values = [np.nan] * (len(current_plotted_cols) * len(self.env.ob_files_handler.tab_list))   # values should have the same order than the CDS columns
            columns = []
            pos = 0
            for tab in self.env.ob_files_handler.tab_list:
                for col in current_plotted_cols:
                    columns.append('{}_{}'.format(tab, col))
                    if self.env.plot_prof_invsbl_points:  # then always visible
                        values[pos] = self.env.cds_df.loc[self.env.sample_to_select, col]
                    else:
                        flag = self.env.tabs_flags_plots[tab]['flag']
                        if self.env.cds_df.loc[self.env.sample_to_select, flag] in self.env.visible_flags:
                            values[pos] = self.env.cds_df.loc[self.env.sample_to_select, col]
                    pos += 1

            lg.info('>> COLUMNS: {}'.format(columns))
            lg.info('>> VALUES: {}'.format(values))
            df = pd.DataFrame(columns=columns)

            if any(not np.isnan(x) for x in values):
                df.loc[self.env.sample_to_select] = values
            cds = ColumnDataSource(df)
            self.env.asterisk_source.data = cds.data
        else: # posibbly reset
            lg.info('>> RESETTING ASTERISK | KEYS: {}'.format(self.env.asterisk_source.data.keys()))
            column_names = list(self.env.asterisk_source.data.keys())
            if 'index' in column_names:
                column_names.remove('index')
            df = pd.DataFrame(columns=column_names)
            cds = ColumnDataSource(df)
            self.env.asterisk_source.data = cds.data

    def _reset_ml_source(self):
        n_plots = self.env.bk_plots_handler.current_n_plots
        columns = ['{}s{}'.format(a, i) for i in range(n_plots) for a in ['x', 'y']]
        columns.append('colors')
        columns.append('line_width')
        ml_df = pd.DataFrame(columns=columns)
        ml_cds = ColumnDataSource(ml_df)
        self.env.ml_source.data = ml_cds.data
