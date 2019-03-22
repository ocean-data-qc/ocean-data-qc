# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.env import Environment

from os import path
import os
import json
from datetime import datetime
import numpy as np
import re


class CruiseDataExport(Environment):
    ''' This class is gathering all the common methods needed to export and save
        the aqc, csv and whp files
    '''
    env = Environment

    def export_whp(self):
        """ Create an export_whp.csv file to export it with node
            it has to be removed by node once it is saved by the user
            It will export the latest saved data
        """
        lg.info('-- EXPORT WHP')
        if path.isfile(path.join(TMP, 'export_whp.csv')):
            os.remove(path.join(TMP, 'export_whp.csv'))

        with open(path.join(TMP, 'export_whp.csv'), 'w') as f_out:
            if self.env.cruise_data.original_type == 'whp':
                with open(path.join(TMP, 'original.csv')) as f_in:
                    f_out.write(f_in.readline())    # get the first line "BOTTLE..."
            elif self.env.cruise_data.original_type == 'csv':
                f_out.write('BOTTLE,{}{}\n'.format(
                    datetime.now().strftime('%Y%m%d'),
                    re.sub(r'\W+', '', APP_SHORT_NAME).upper()
                ))

            f_out.write('# {} Edited by {}\n'.format(
                datetime.now().strftime('%Y-%m-%d'), APP_LONG_NAME
            ))

            with open(path.join(TMP, 'metadata')) as f_in:
                for line in f_in:
                    f_out.write('# {}'.format(line))

            columns = self.get_cols_by_type(  # column order?
                ['required', 'param', 'non_qc_param', 'qc_param_flag', 'param_flag']
            )
            columns_row = ','.join(columns)
            f_out.write(columns_row + '\n')

            units = self.get_units()
            units = [x if x is not False else '' for x in units]
            units_row = ','.join(units)
            f_out.write(units_row + '\n')

            aux_df = self.df.copy()
            aux_df = aux_df.replace(np.nan, -999.0)  # float64 fields value will be -999.0

            for index, row in aux_df[columns].iterrows():
                str_row =  ','.join([str(x) for x in row])   # TODO: take values with commas into account
                f_out.write(str_row + '\n')

            f_out.write('END_DATA')
            return True

    def export_csv(self):
        """ Create an export_data.csv file to export it with node
            It will export the latest saved data
        """
        lg.info('-- EXPORT CSV')
        if path.isfile(path.join(TMP, 'export_data.csv')):
            os.remove(path.join(TMP, 'export_data.csv'))
        aux_df = self.df.copy()
        aux_df = aux_df.replace(np.nan, -999.0)  # float64 fields value will be -999.0
        cols = self.get_cols_by_type(['required', 'param', 'non_qc_param','qc_param_flag', 'param_flag'])
        aux_df = aux_df.filter(cols)
        orig_col_names = []
        for c in cols:
            if 'orig_name' in self.cols[c]:
                orig_col_names.append(self.cols[c]['orig_name'])  # computed do not have orig_name
            else:
                orig_col_names.append(c)
        aux_df.to_csv(
            path_or_buf=os.path.join(TMP, 'export_data.csv'),
            header=orig_col_names,
            index=False,
        )
        return True

    def save_csv_data(self):
        """ it saves the dataframe self.df to the data.csv file
            the columns x_wm and y_wm are not saved because they are
            automatically generated from LATITUDE and LONGITUDE columns
        """
        lg.info('-- SAVING DATA TO data.csv')

        aux_df = self.df.copy(deep=True)
        if 'AUX' in aux_df.columns:
            del aux_df['AUX']

        aux_df.to_csv(
            os.path.join(TMP, 'data.csv'),
            # index_label='HASH_ID',
            index=False,
        )

    def save_moves(self):
        lg.info('-- SAVE MOVES')
        if not self.moves.empty:
            self.moves.to_csv(
                os.path.join(TMP, 'moves.csv'),
                index_label='index',
            )

    def save_attributes(self):
        """ The file columns.json is created """
        lg.info('-- SAVE ATTRIBUTES to JSON')
        with open(path.join(TMP,'columns.json'), 'w') as fp:
            json.dump(self.cols, fp, indent=4, sort_keys=True)

    def save_metadata(self):
        if not path.isfile(path.join(TMP, 'metadata')):
            with open(path.join(TMP, 'original.csv'), 'r', errors="ignore") as file:
                meta = open(path.join(TMP, 'metadata'),'w')
                for line in file:
                    if line.startswith('#'):
                        meta.write(line[2:]) # python will convert \n to os.linesep
                                             # TODO >> if a file is firstly open with windows and then it is open with linux
                                             # I am afraid the breaklines are not going to work well

    def save_tmp_data(self):
        lg.info('-- SAVE TMP DATA')
        self.save_moves()
        self.save_csv_data()
        self.save_attributes()
        self.save_metadata()