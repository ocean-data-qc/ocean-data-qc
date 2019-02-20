# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.data_models.computed_parameter import ComputedParameter
from ocean_data_qc.data_models.cruise_data_export import CruiseDataExport

import csv
import json
import os
import pandas as pd
import numpy as np
from os import path
import hashlib
from datetime import datetime
from shutil import rmtree
import re


class CruiseData(CruiseDataExport):
    ''' This class is gathering all the common methods needed to manage
        the aqc, csv and whp files
    '''
    env = CruiseDataExport.env

    def __init__(self, original_type=''):
        lg.info('-- INIT CRUISE DATA PARENT')
        self.original_type = original_type      # original.csv type (whp, csv)
        self.df = None                          # numeric DataFrame
        self.df_str = None                      # string DataFrame
        self.moves = None
        self.cols = {}

        self._validate_original_data()
        self._set_moves()                       # TODO: this is not needed for cd_update
        self._set_df()
        self.load_file()        # implemented in the children
        return self

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
        if self.original_type == 'whp':
            units_list = self.df.iloc[0].values.tolist()  # TODO: how to detect if there are units or not?
                                                          #       how to fill the units fields then?
        else:
            units_list = []
        pos = 0
        column_list = self.df.columns.tolist()
        for column in column_list:
            self._add_column(column=column)
            if units_list != []:
                if str(units_list[pos]) == 'nan':
                    self.cols[column]['unit'] = False
                else:
                    self.cols[column]['unit'] = units_list[pos]
            pos += 1

        # lg.info(json.dumps(self.cols, sort_keys=True, indent=4))

        if self.original_type == 'whp':
            self.df = self.df[1:-1].reset_index(drop=True)          # rewrite index column and remove the units row

    def _sanitize_flags(self):
        lg.info('-- SANITIZING FLAGS --')
        column_list = self.df.columns.tolist()
        for column in column_list:
            flag = column + FLAG_END
            if flag in column_list:
                try:
                    self.df[flag][pd.isnull(self.df[column])] = 9
                except:
                    lg.warning('Unable to sanitize flag %s for column %s', flag, column)

    def _add_column(self, column='', units=False):
        ''' Adds a column to the self.cols dictionary
            This dictionary is useful to select some columns by type
        '''
        if column not in self.get_columns_by_type('all'):
            self.cols[column] = {
                'types': [],
                'unit': units,
            }
            if column.endswith(FLAG_END):
                self.cols[column]['types'] += ['param_flag']
                flags_not_to_qc = [x + FLAG_END for x in NON_QC_PARAMS]
                if column not in flags_not_to_qc:
                    self.cols[column]['types'] += ['qc_param_flag']
            else:
                if column in REQUIRED_COLUMNS:
                    self.cols[column]['types'] += ['required']
                elif column in NON_QC_PARAMS:
                    self.cols[column]['types'] += ['non_qc_param']
                else:
                    self.cols[column]['types'] += ['param']

                qc_column_exceptions = NON_QC_PARAMS + REQUIRED_COLUMNS
                flag = column + FLAG_END
                column_list = self.df.columns.tolist()
                if flag not in column_list and column not in qc_column_exceptions:
                    lg.info('>> ROWS LENGTH: {}'.format(len(self.df.index)))
                    lg.info('>> CREATING FLAG: {}'.format(flag))
                    values = ['2'] * len(self.df.index)
                    self.df[flag] = values
                    self.cols[flag] = {
                        'types': ['param_flag', 'qc_param_flag'],
                        'unit': False,
                    }
                    self.add_moves_element(
                        'flag_column_added',
                        'Flag column that was missing added to the project '
                        'with default value "2" in all the rows: {}'.format(flag)
                    )

    def _init_early_calculated_params(self):
        ''' Initializates the dataframe with the basic params that all csv files should have.
            If some of them do not exist in the dataframe yet, they are created with the default values
        '''
        for pname in BASIC_PARAMS:
            if pname not in self.get_columns_by_type('all'):
                if pname.endswith(FLAG_END):
                    self.df[pname] = np.array(['9'] * self.df.index.size)
                    self.add_moves_element(
                        'flag_column_added',
                        'Basic flag column added to the project '
                        ' with default value "9" in all the rows: {}'.format(pname)
                    )
                else:
                    self.df[pname] = np.array([np.nan] * self.df.index.size)
                    self.add_moves_element(
                        'column_added',
                        'Basic column added to the project'
                        ' with default value "NaN" in all the rows: {}'.format(pname)
                    )
                self._add_column(column=pname, units=False)

    def _set_attributes_from_json_file(self):
        """ The attributes (cols) are set directly from the attributes.json file """
        lg.info('-- SET ATTRIBUTES FROM JSON FILE --')
        if path.isfile(path.join(TMP, 'attributes.json')):
            with open(path.join(TMP, 'attributes.json'), 'r') as f:
                attr = json.load(f)
            self.cols = attr

    def get_columns_by_type(self, column_types=[], discard_nan=False):
        ''' Possible types:
                * computed      - calculated parameters
                * param         - parameters
                * non_qc_param  - params without qc column
                * param_flag    - existing flags for the params that were loaded from the beginning
                * qc_param_flag - flags that were created by the application with value 2
                * required      - required columns

            @discard_nan - discards columns with all the values = NaN

            NOTE: a flag param could have the types 'param_flag' and 'qc_param_flag' at the same time
        '''
        if isinstance(column_types, str):
            column_types = [column_types]
        if len(column_types) == 1 and 'all' in column_types:
            column_types = [
                'computed', 'param', 'non_qc_param',
                'param_flag', 'qc_param_flag', 'required'
            ]
        res = []
        for t in column_types:
            for c in self.cols:
                if t in self.cols[c]['types']:
                    if c not in res:
                        res.append(c)
        res = list(set(res))  # one column may have multiple types
        df_cols = list(self.df.columns)
        col_positions = dict(
            [(df_cols[df_cols.index(x)], df_cols.index(x)) for x in df_cols]  # {'COL1': 0, 'COL2': 1, ...}
        )
        prepaired_list = [(col_positions[x], x) for x in res]
        sorted_list = sorted(prepaired_list, key=lambda elem: elem[0])  # reordering
        final_list = [x[1] for x in sorted_list]
        if discard_nan:
            final_list = self._discard_nan_columns(final_list)
        return final_list

    def _discard_nan_columns(self, col_list):
        final_cols = list(col_list)
        for c in col_list:
            if self.df[c].isnull().all():
                final_cols.remove(c)
        final_cols.sort()
        return final_cols

    @property
    def stations(self):
        return list(self.df.drop_duplicates(STNNBR)[STNNBR])

    def get_units(self):
        return [self.cols[x]['unit'] for x in self.cols]

    def is_flag(self, flag):
        if flag[-7:] == FLAG_END and flag in self.get_columns_by_type(['param_flag', 'qc_param_flag']):
            return True
        else:
            return False

    def _set_df(self):
        """ it creates the self.df dataframe object
            taking into account if data.csv is created or not

            @from_scratch: boolean to force the loading from scratch
        """
        lg.info('-- SET DF')
        try:
            self.df = pd.read_csv(
                filepath_or_buffer=self.filepath_or_buffer,
                comment='#',
                delimiter=',',
                skip_blank_lines=True,
                engine='c',                 # engine='python' is more versatile, 'c' is faster
                dtype=str,                  # useful to make some replacements before casting to numeric values
                skiprows=self.skiprows
                # verbose=False             # indicates the number of NA values placed in non-numeric columns
            )
            lg.info('>> PANDAS using \'c\' engine')
        except:
            self.df = pd.read_csv(
                filepath_or_buffer=self.filepath_or_buffer,
                comment='#',
                delimiter=',',
                skip_blank_lines=True,
                engine='python',                 # engine='python' is more versatile, 'c' is faster
                dtype=str,                  # useful to make some replacements before casting to numeric values
                skiprows=self.skiprows
                # verbose=False             # indicates the number of NA values placed in non-numeric columns
            )
            lg.info('>> PANDAS using \'python\' engine')
        # lg.info('\n\n>> DF: \n\n{}'.format(self.df))
        self.df.replace('\s', '', regex=True, inplace=True)  # cleans spaces: \r and \n are managed by read_csv
        self.df.columns = self._sanitize(self.df.columns)  # remove spaces from columns
        self.df.columns = self._sanitize_alternative_names(self.df.columns)
        try:
            self.df.columns.index('DATE')
        except:
            lg.info('-- trying to generate a DATE column')
            try:
                self.df = self.df.assign(DATE=pd.to_datetime(self.df[['YEAR', 'MONTH', 'DAY']]).dt.strftime('%Y%m%d'))
            except Exception as e:
                lg.warning('--      {}'.format(e))

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

    def _validate_required_columns(self):
        lg.info('-- VALIDATE REQUIRED COLUMNS')
        if (not set(self.get_columns_by_type('all')).issuperset(REQUIRED_COLUMNS)):
            missing_columns = ', '.join(list(set(REQUIRED_COLUMNS) - set(self.get_columns_by_type('all'))))
            raise ValidationError(
                'Missing required columns in the file: [{}]'.format(missing_columns),
                rollback='cruise_data'
            )

    def _sanitize(self, names):
        lg.info('-- Sanitizing colnames')
        result = []
        for name in names:
            name = name.replace('-', '_')
            name = name.replace('+', '_')
            name = name.replace(' ', '')
            result.append(name)
        return result

    def _replace_if_not_exists(self, columns, orig_name, replace_with):
        if not orig_name in columns:
            columns = [re.sub(r'\b'+replace_with+r'\b', orig_name, c) for c in columns]
            if replace_with + 'F' in columns:
                columns = [re.sub(r'\b'+replace_with + 'F'+r'\b', orig_name + '_FLAG_W', c) for c in columns]
        return columns


    def _sanitize_alternative_names(self, names):
        lg.info('-- Sanitizing usual alternative colnames')
        result = [n.upper() for n in names]
        result = self._replace_if_not_exists(result, 'EXPOCODE', 'CRUISE')
        result = self._replace_if_not_exists(result, 'EXPOCODE', 'CRUISENO')
        result = self._replace_if_not_exists(result, 'STNNBR', 'STATION')
        result = self._replace_if_not_exists(result, 'CASTNO', 'CAST')
        result = self._replace_if_not_exists(result, 'BTLNBR', 'BOTTLE')
        result = self._replace_if_not_exists(result, 'CTDPRS', 'PRESSURE')
        result = self._replace_if_not_exists(result, 'CTDTMP', 'TEMPERATURE')
        result = self._replace_if_not_exists(result, 'SALNTY', 'SALINITY')
        result = self._replace_if_not_exists(result, 'SALNTY', 'CTDSAL')
        result = self._replace_if_not_exists(result, 'NITRAT', 'NITRATE')
        result = self._replace_if_not_exists(result, 'NITRIT', 'NITRITE')
        result = self._replace_if_not_exists(result, 'PHSPHT', 'PHOSPHATE')
        result = self._replace_if_not_exists(result, 'SILCAT', 'SILICATE')
        result = self._replace_if_not_exists(result, 'TCARBN', 'TCO2')
        result = self._replace_if_not_exists(result, 'TCARBN', 'DIC')
        result = self._replace_if_not_exists(result, 'TCARBN', 'CT')
        result = self._replace_if_not_exists(result, 'ALKALI', 'TALK')
        result = self._replace_if_not_exists(result, 'ALKALI', 'ALK')
        result = self._replace_if_not_exists(result, 'PH_TOT', 'PHTS')
        result = self._replace_if_not_exists(result, 'PH_TOT', 'PHTS25')
        result = self._replace_if_not_exists(result, 'PH_TOT', 'PHTS25P0')
        result = self._replace_if_not_exists(result, 'PH_TOT', 'PH_TOT25P0')
        result = self._replace_if_not_exists(result, 'PH_SWS', 'PHSWS')
        result = self._replace_if_not_exists(result, 'PH_SWS', 'PHSWS25')
        result = self._replace_if_not_exists(result, 'PH_SWS', 'PHSWS25P0')
        result = self._replace_if_not_exists(result, 'PH_TOT', 'PH_SWS25P0')
        result = self._replace_if_not_exists(result, 'NO2_NO3', 'NO2NO3')
        result = self._replace_if_not_exists(result, 'CFC_11', 'CFC11')
        result = self._replace_if_not_exists(result, 'CFC_12', 'CFC12')
        for name in result:
            if name + 'F' in result:
<<<<<<< HEAD
<<<<<<< HEAD
                result = [r.replace(name + 'F' , name + '_FLAG_W') for r in result]
=======
                result = [re.sub(r'\b'+name + 'F'+r'\b', name + '_FLAG_W', r) for r in result]
>>>>>>> Fix parameter substitutions
=======
                result = [re.sub(r'\b'+name + 'F'+r'\b', name + FLAG_END, r) for r in result]
>>>>>>> Make the updates work again
        lg.info(result)
        return result

    def _replace_nan_values(self):
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
        self.df_str = self.df.copy(deep=True)    # TODO: this has to be synchronized when seld.df is updated
        self.df = self.df.apply(lambda x: pd.to_numeric(x, errors='ignore', downcast='integer'))

        # if the new values are float >> check the original string to make the rounding well

        self.df = self.df.round(5)  # TODO: round with the original number of decimals >> float comparison
                                    #       I think this rounding can be made by df column

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

        self.save_tmp_data()

    def add_moves_element(self, action, description):
        lg.info('-- ADD ELEM TO MOVES.csv --')
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not self.moves.empty:
            last_pos = self.moves.tail(1).index[0]
            self.moves.loc[last_pos + 1] = [date, action, '', '', '', '', '', '', '', description]  # fastest way to add a row at the end
        else:
            self.moves.loc[0] = [date, action, '', '', '', '', '', '', '', description]
