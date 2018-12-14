# -*- coding: utf-8 -*-
################################################################
#    License, author and contributors information in:          #
#    LICENSE file at the root folder of this application.      #
################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.data_models.computed_parameter import ComputedParameter
from ocean_data_qc.env import Environment

import csv
import json
import os
import pandas as pd
import numpy as np
from os import path
import hashlib
from datetime import datetime
from shutil import rmtree

# TODO: split this class in separated classes
#       one class to each type of imported file or way to open the project

class CruiseData(Environment):
    env = Environment

    def __init__(self):
        lg.info('-- INIT CRUISE DATA OBJECT')
        self.env.sh_cruise_data = self
        self.is_whp_format = False
        self.df = None
        self.moves = None
        self.cp = ComputedParameter(self)
        self.format_is_valid = False
        self.cols = {}
        self.format = ''  # 'whp', 'csv'

    def _rollback(self):
        self.is_whp_format = False
        self.df = None
        self.moves = None
        self.cp = ComputedParameter(self)
        self.format_is_valid = False
        self.cols = {}
        self.format = ''  # 'whp', 'csv'

    def get_initial_columns(self):
        lg.info('-- GET INITIAL COLUMNS')
        self.load_file()
        columns = self.get_plotable_columns()
        return columns

    def load_file(self):
        self._set_moves()
        self._check_whp_format(ORIGINAL_CSV)

        from_scratch = not path.isfile(path.join(TMP, 'data.csv'))  # TODO: find a better way to define this
        if from_scratch:
            self._load_from_scratch()
        else:
            self._load_from_files()

        result = self.cp.set_computed_parameters()
        if result is False:
            lg.warning('Some computed parameter could not be computed')  # TODO: build something to recover the current project
        self.cp.add_all_possible_cps()

    def _load_from_scratch(self):
        lg.info('-- LOAD FROM SCRATCH')
        self._set_df()
        self._set_attributes_from_scratch()  # the dataframe has to be created
        self._validate_required_columns()
        self._replace_missing_values()         # '-999' >> NaN
        self._convert_data_to_number()
        self._init_early_calculated_params()
        self._set_hash_ids()

        # TODO: confusing methods names, options: "save in temporal folder"
        self.save_data()
        self.save_attributes()
        self.save_metadata()

    def _load_from_files(self):
        lg.info('-- LOAD FROM FILES')
        self._set_df()
        self._set_attributes_from_json_file()
        self._replace_missing_values()         # '-999' >> NaN
        self._convert_data_to_number()
        self._set_hash_ids()

    def _set_attributes_from_scratch(self):
        """ The main attributes of the object are filled:

                "cols": {
                    "ALKALI": {
                        "types": ["param"],
                        "required": False,
                        "unit": "UMOL/KG",
                    },
                    "ALKALI_FLAG_W": {
                        "types": ["param_flag", "qc_param_flag"],
                        "required": False,
                        "unit": NaN,  # >> False
                    }
                }
        """
        lg.info('-- SET ATTRIBUTES FROM SCRATCH --')

        if self.is_whp_format:
            units_list = self.df.iloc[0].values.tolist()  # TODO: how to detect if there are units or not?
                                                          #       how to fill the units fields then?
        else:
            units_list = []
        pos = 0
        column_list = self.df.columns.tolist()
        flags_not_to_qc = [x + FLAG_END for x in NON_QC_PARAMS]
        qc_column_exceptions = NON_QC_PARAMS + REQUIRED_COLUMNS
        for column in column_list:
            self.cols[column] = {   # column intialization
                'types': [],
                'unit': False,  # TODO: if a non WHP CSV is open this should be NaN
            }
            if FLAG_END in column:
                self.cols[column]['types'] += ['param_flag']
                if column not in flags_not_to_qc:
                    self.cols[column]['types'] += ['qc_param_flag']
            else:
                if column in REQUIRED_COLUMNS:
                    self.cols[column]['types'] += ['required']
                elif column not in NON_QC_PARAMS:
                    self.cols[column]['types'] += ['param']
                else:
                    self.cols[column]['types'] += ['non_qc_param']

                flag = column + FLAG_END
                if flag not in column_list and column not in qc_column_exceptions:
                    lg.info('>> ROWS LENGTH: {}'.format(len(self.df.index)))
                    lg.info('>> CREATING FLAG: {}'.format(flag))
                    values = ['2'] * len(self.df.index)  # it should be still string here
                    self.df[flag] = values

                    self.cols[flag] = {
                        'types': ['param_flag', 'qc_param_flag'],
                        'unit': False,
                    }

            if units_list != []:
                if str(units_list[pos]) == 'nan':
                    self.cols[column]['unit'] = False
                else:
                    self.cols[column]['unit'] = units_list[pos]
            pos += 1

        # lg.info(json.dumps(self.cols, sort_keys=True, indent=4))

        if self.format == 'whp':
            self.df = self.df[1:-1].reset_index(drop=True)          # rewrite index column and remove the units row

    def _init_early_calculated_params(self):
        # init empty missing params
        param_list = {'CTDSAL', 'SALNTY', 'CTDOXY', 'OXYGEN', 'CTDPRS', 'DEPTH',
                      'NITRAT','PHSPHT','NITRIT','NO2_NO3',
                      'CTDSAL_FLAG_W', 'SALNTY_FLAG_W', 'CTDOXY_FLAG_W', 'OXYGEN_FLAG_W',
                      'NITRAT_FLAG_W','PHSPHT_FLAG_W','NITRIT_FLAG_W','NO2_NO3_FLAG_W'}
        for pname in param_list:
            if not pname in self.df.dtypes:
                if pname.endswith('FLAG_W'):
                    self.df[pname]=np.array([9]*self.df.index.size)
                else:
                    self.df[pname]=np.array([np.nan]*self.df.index.size)

    def _set_attributes_from_json_file(self):
        """ The attributes (cols) are set directly from the attributes.json file """
        lg.info('-- SET ATTRIBUTES FROM JSON FILE --')
        if path.isfile(path.join(TMP, 'attributes.json')):
            with open(path.join(TMP, 'attributes.json'), 'r') as f:
                attr = json.load(f)
            self.cols = attr

    def get_columns_by_type(self, column_types=[]):
        ''' Possible types:
                * computed      - calculated parameters
                * param         - parameters
                * non_qc_param  - params without qc column
                * param_flag    - params that have qc flag columns
                * qc_param_flag - flags that were created by the application with value 2
                * required      - required columns
        '''
        res = []
        for t in column_types:
            for c in self.cols:
                if t in self.cols[c]['types']:
                    res.append(c)
        res = list(set(res))  # one column may have multiple types
        df_cols = list(self.df.columns)
        col_positions = dict(
            [(df_cols[df_cols.index(x)], df_cols.index(x)) for x in df_cols]  # {'COL1': 0, 'COL2': 1, ...}
        )
        prepaired_list = [(col_positions[x], x) for x in res]
        sorted_list = sorted(prepaired_list, key=lambda elem: elem[0])  # reordering
        final_list = [x[1] for x in sorted_list]
        return final_list

    @property
    def stations(self):
        return list(self.df.drop_duplicates(STNNBR)[STNNBR])

    def get_all_columns(self):
        """ Return a list of columns """
        return [x for x in self.cols]

    def get_params(self):
        return [x for x in self.cols if 'param' in self.cols[x]['types']]

    @property
    def params(self):
        return [x for x in self.cols if 'param' in self.cols[x]['types']]

    def get_params_flags(self):
        return [x for x in self.cols if 'param_flag' in self.cols[x]['types']]

    @property
    def all_params_flags(self):
        return [x for x in self.cols if 'param_flag' in self.cols[x]['types'] or 'qc_param_flag' in self.cols[x]['types']]

    def get_qc_params_flags(self):
        return [x for x in self.cols if 'qc_param_flag' in self.cols[x]['types']]

    def get_units(self):
        return [self.cols[x]['unit'] for x in self.cols]

    def get_plotable_columns(self):
        plot_cols = [x for x in self.cols if 'param' in self.cols[x]['types'] or 'param_flag' in self.cols[x]['types'] or 'qc_param_flag' in self.cols[x]['types'] or 'computed' in self.cols[x]['types']]

        # Columns with all NaN values are not plotable neither
        for c in plot_cols:
            if self.df[c].isnull().all():
                plot_cols.remove(c)

        plot_cols.sort()
        return plot_cols

    def get_plotable_non_computed_params(self):
        # TODO: remove this method, use the property instead
        col = [x for x in self.cols if 'param' in self.cols[x]['types'] or 'param_flag' in self.cols[x]['types'] or 'qc_param_flag' in self.cols[x]['types'] and 'computed' not in self.cols[x]['types']]
        col.sort()
        return col

    @property
    def plotable_non_computed_params(self):
        col = [x for x in self.cols if 'param' in self.cols[x]['types'] or 'param_flag' in self.cols[x]['types'] or 'qc_param_flag' in self.cols[x]['types'] and 'computed' not in self.cols[x]['types']]
        col.sort()
        return col

    def get_computed_params(self):
        return [x for x in self.cols if 'computed' in self.cols[x]['types']]

    def get_plot_cp_params(self):
        return {
            'plotable_columns': self.get_plotable_columns(),
            'computed': self.get_computed_params()
        }

    def is_flag(self, flag):
        if flag[-7:] == FLAG_END and flag in self.all_params_flags:
            return True
        else:
            return False

    def _set_df(self, from_scratch=False):
        """ it creates the self.df dataframe object
            taking into account if data.csv is created or not

            @from_scratch: boolean to force the loading from scratch
        """
        lg.info('-- SET DF')

        filepath_or_buffer = ''
        skiprows = 0
        data_exists = path.isfile(path.join(TMP, 'data.csv'))
        lg.info('>> DATA EXISTS: {} | FROM SCRATCH: {} | IS WHP FORMAT: {}'.format(
            data_exists, from_scratch, self.is_whp_format)
        )
        if (data_exists is False or from_scratch) and self.is_whp_format:  # WHP format
            self.format = 'whp'
            skiprows = 1
            filepath_or_buffer = ORIGINAL_CSV
        else:
            if data_exists is True and from_scratch is False:   # data.csv was previously saved
                self.format = 'whp'                             # TODO: actually I do not know the format here,
                                                                #       only that the project was open
                filepath_or_buffer = DATA_CSV
                skiprows = 0
            else:
                self.format = 'csv'                                     # flat CSV format
                filepath_or_buffer = ORIGINAL_CSV
                skiprows = 0

                # TODO: I do not know if I should take into account the index column
                #       and the units row?

        self.df = pd.read_csv(
            filepath_or_buffer=filepath_or_buffer,
            comment='#',
            delimiter=',',
            skip_blank_lines=True,
            engine='c',                 # engine='python' is more versatile, 'c' is faster
            dtype=str,                  # useful to make some replacements before casting to numeric values
            skiprows=skiprows,
            # verbose=False             # indicates the number of NA values placed in non-numeric columns
        )
        # lg.info('\n\n>> DF: \n\n{}'.format(self.df))
        self.df.replace('\s', '', regex=True, inplace=True)  # cleans spaces: \r and \n are managed by read_csv
        self.df.columns = self._sanitize(self.df.columns)    # remove spaces from columns

    def _set_moves(self):
        """ create the self.moves dataframe object
            taking into account if moves.csv is already created or not
        """
        if path.isfile(MOVES_CSV) and os.stat(MOVES_CSV).st_size != 0:
            self.moves = pd.read_csv(
                MOVES_CSV, delimiter=',', skip_blank_lines=True,
                verbose=True, engine='python', index_col=0, dtype=str
            )
        else:
            columns = [
                'date', 'action', 'stnnbr', 'castno',
                'btlnbr', 'latitude', 'longitude', 'param', 'value', 'description'
            ]
            self.moves = pd.DataFrame(columns=columns, dtype=str)

    def save_metadata(self):
        if not path.isfile(path.join(TMP, 'metadata')):
            with open(path.join(TMP, 'original.csv'), 'r', errors="ignore") as file:
                meta = open(path.join(TMP, 'metadata'),'w')
                for line in file:
                    if line.startswith('#'):
                        meta.write(line[2:]) # python will convert \n to os.linesep
                                             # TODO >> if a file is firstly open with windows and then it is open with linux
                                             # I am afraid the breaklines are not going to work well

    def _set_hash_ids(self):
        """ Create a column id for the whp-exchange files
            this new column is a hash of these fields combined:
                * STNNBR     station number
                * CASTNO     cast number (it may exist or not)
                * BTLNBR     bottle number (it may exist or not)
                * LATITUDE   latitude
                * LONGITUDE  longitude
        """
        self.df['HASH_ID'] = self.df[[
            'STNNBR', 'CASTNO', 'BTLNBR', 'LATITUDE', 'LONGITUDE'   # if BTLNBR is NaN the hash is made correctly as well
        ]].astype(str).apply(                                       # astype is 4x slower than apply
            lambda x: hashlib.sha256(str.encode(str(tuple(x)))).hexdigest(), axis=1
        )
        self.df = self.df.set_index(['HASH_ID'])

    def _check_whp_format(self, csv_path=None):
        if path.isfile(csv_path):
            with open(csv_path, 'rt', encoding="ascii", errors="surrogateescape") as f:
                raw_data = f.read()
        else:
            raise FileNotFoundError('The file original.csv was not found in the TMP folder')

        if raw_data.startswith('BOTTLE'):
            lg.info('--   HAS BOTTLE')
            if raw_data.endswith('END_DATA'):
                lg.info('--   HAS END_DATA')
                self.is_whp_format = True
            elif raw_data.split('\n')[-1].startswith('END_DATA'):
                lg.info('--   HAS WEIRD END_DATA')
                self.is_whp_format = True
            elif raw_data.split('\n')[-2].startswith('END_DATA'):
                print('--   HAS WEIRD END_DATA 2')
                self.is_whp_format = True

    def _validate_required_columns(self):
        self.format_is_valid = True

        # TODO: check if all the columns values are valid as well

        if(not set(self.get_all_columns()).issuperset(REQUIRED_COLUMNS)):
            self.format_is_valid = False
            missing_columns = ', '.join(list(set(REQUIRED_COLUMNS) - set(self.get_all_columns())))
            self._rollback()
            # rmtree(TMP)  # TODO: only if we are not in the CruiseDataUpdate object
            raise ValidationError(
                'Missing required columns in the file: [{}]'.format(
                    missing_columns
                )
            )

    def save_data(self):
        """ it saves the dataframe self.df to the data.csv file
            the columns x_wm and y_wm are not saved because they are
            automatically generated in ploting.py from LATITUDE and LONGITUDE columns
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
        """ The file attributes.json is created """
        lg.info('-- SAVE ATTRIBUTES to JSON')
        with open(path.join(TMP,'attributes.json'), 'w') as fp:
            json.dump(self.cols, fp, indent=4, sort_keys=True)

    def _sanitize(self, names):
        result = []
        for name in names:
            name = name.replace('PH_TS', 'PH_TOT')
            name = name.replace('NO2NO3','NO2_NO3')
            name = name.replace('-', '_')
            name = name.replace('+', '_')
            name = name.replace(' ', '')
            result.append(name)
        return result

    def _replace_missing_values(self):
        ''' Replaces the -990.0, -999.00, etc values to NaN.
            There will be strings and floats in the same column because NaN is considered a float64
            and this step should be before the numeric conversion
        '''
        lg.info('-- REPLACE MISSING VALUES (-999 >> NaN)')
        # self.df = self.df.applymap(lambda x: str.strip(x))  # trim spaces, we do  this with the raw data directly
        self.df.replace(
            to_replace=NA_REGEX_LIST,
            value='', #np.nan,
            inplace=True,
            regex=True,
        )

    def _convert_data_to_number(self):
        ''' Converts the DF from string to numeric values
            downcasting the resulting data to the smallest numerical dtype possible (int8 is the minimum)

            If the column has float values, all the column will have
            the same number of decimals (the maximum, but the zero is not taking into account)

            If a cell of a column with dtype=np.int8 is assign to some int64 value, then the column
            is completely converted to int64
        '''
        self.df = self.df.apply(lambda x: pd.to_numeric(x, errors='ignore', downcast='integer'))

        # if the new values are float >> check the original string to make the rounding well

        self.df = self.df.round(5)  # TODO: round with the original number of decimals >> float comparison

    def update_flag_values(self, column, new_flag_value, row_indices):
        """ This method is executed mainly when a flag is pressed to update the values
                * column: it is the column to update, only one column
                * new_flag_value: it is the flag value
        """
        lg.info('-- UPDATE DATA --')

        lg.info('>> COLUMN: %s | VALUE: %s | ROWS: %s' % (column, new_flag_value, row_indices))
        # lg.info('\n\nData previous changed: \n\n%s' % self.df[[ column ]].iloc[row_indices])

        hash_index_list = self.df.index[row_indices]
        self.df.loc[hash_index_list,(column)] = new_flag_value

        # lg.info('\n\nData after changed: \n\n%s' % self.df[[ column ]].iloc[row_indices])

        # Update the action log
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        action = 'QC Update'

        for row in row_indices:
            stnnbr = self.df[[ 'STNNBR' ]].iloc[row][0]
            castno = self.df[[ 'CASTNO' ]].iloc[row][0]
            btlnbr = self.df[[ 'BTLNBR' ]].iloc[row][0]
            latitude = self.df[[ 'LATITUDE' ]].iloc[row][0]
            longitude = self.df[[ 'LONGITUDE' ]].iloc[row][0]
            description = '{COLUMN} flag was updated to {FLAG}, in [station {STNNBR}, cast number {CASTNO}, bottle {BTLNBR}, latitude {LATITUDE}, longitude {LONGITUDE}]'.format(
                COLUMN=column, FLAG=new_flag_value, STNNBR=stnnbr, CASTNO=castno,
                BTLNBR=btlnbr, LATITUDE=latitude, LONGITUDE=longitude,
            )
            lg.info('>> MOVES LOG: {}, {}, {}'.format(date, action, description))

            fields = [date, action, stnnbr, castno, btlnbr, latitude, longitude, column, new_flag_value, description]
            if not self.moves.empty:
                last_pos = self.moves.tail(1).index[0]
                self.moves.loc[last_pos + 1] = fields  # fastest way to add a row at the end
            else:
                self.moves.loc[0] = fields

        self.save_data()
        self.save_attributes()
        self.save_moves()

    def add_moves_element(self, action, description):
        lg.info('-- ADD ELEM TO MOVES.csv --')
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not self.moves.empty:
            last_pos = self.moves.tail(1).index[0]
            self.moves.loc[last_pos + 1] = [date, action, '', '', '', '', '', '', '', description]  # fastest way to add a row at the end
        else:
            self.moves.loc[0] = [date, action, '', '', '', '', '', '', '', description]

    def export_whp(self):
        """ Create an export_whp.csv file to export it with node
            it has to be removed by node once it is saved by the user
            It will export the latest saved data
        """
        lg.info('-- EXPORT WHP')

        if path.isfile(path.join(TMP, 'export_whp.csv')):
            os.remove(path.join(TMP, 'export_whp.csv'))

        with open(path.join(TMP, 'export_whp.csv'), 'w') as f_out:
            with open(path.join(TMP, 'original.csv')) as f_in:
                f_out.write(f_in.readline())    # get the first line ("BOTTLE...") from the original file
            f_out.write('# {} Edited by Atlantos QC\n'.format(datetime.now().strftime('%m/%d/%Y')))
            with open(path.join(TMP, 'metadata')) as f_in:
                for line in f_in:
                    f_out.write('# {}'.format(line))

            columns = self.get_columns_by_type(['required', 'param', 'non_qc_param', 'qc_param_flag', 'param_flag'])        # column order?
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
        cols = self.get_columns_by_type(['required', 'param', 'non_qc_param','qc_param_flag', 'param_flag'])
        aux_df = aux_df.filter(cols)
        aux_df.to_csv(
            os.path.join(TMP, 'export_data.csv'),
            index=False,
        )
        return True
