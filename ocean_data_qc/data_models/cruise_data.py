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
        the aqc, csv and whp files (instantiated with the children classes)
    '''
    env = CruiseDataExport.env

    def __init__(self, original_type='', cd_aux=False):
        lg.info('-- INIT CRUISE DATA PARENT')
        self.original_type = original_type      # original.csv type (whp, csv)
        self.cd_aux = cd_aux
        self.df = None                          # numeric DataFrame
        self.df_str = None                      # string DataFrame
        self.moves = None
        self.cols = {}
        self.orig_cols = {}

        self._validate_original_data()
        self._set_moves()                       # TODO: this is not needed for cd_update
        self._set_df()
        self._prep_df_columns()
        self.cp_param = ComputedParameter(self)

    def _set_cols_from_scratch(self):
        """ The main attributes of the object are filled:

                "cols": {
                    "ALKALI": {
                        "orig_name": "alkali",
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

            TODO: to create less noise in the JSON structure:
                  unit and orig_name should not exist if they do not have any value
        """
        lg.info('-- SET ATTRIBUTES FROM SCRATCH')
        if self.original_type == 'whp':
            units_list = self.df.iloc[0].values.tolist()  # TODO: how to detect if there are units or not?
                                                          #       how to fill the units fields then?
        else:
            units_list = []
        pos = 0
        column_list = self.df.columns.tolist()
        lg.info('>> SELF ORIG COLS: {}'.format(self.orig_cols))
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
                * required      - required columns
                * param         - parameter columns
                * param_flag    - flag columns
                * qc_param_flag - flag columns created by this app
                * non_qc_param  - parameters without flag columns associated
                * computed      - computed parameters
        '''
        if column not in self.get_cols_by_type('all'):
            self.cols[column] = {
                'types': [],
                'unit': units,
                'orig_name': self.orig_cols.get(column, column),
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
                self.create_missing_flag_col(column)

    def create_missing_flag_col(self, param=None):
        ''' Make sure there is a flag column for each param parameter '''
        if param is not None and isinstance(param, str) and not param.endswith(FLAG_END):
            flag = param + FLAG_END
            cols = self.df.columns.tolist()
            if flag not in cols and param not in NON_QC_PARAMS:
                lg.info('>> CREATING FLAG: {}'.format(flag))
                values = ['2'] * len(self.df.index)
                self.df[flag] = values

                # TODO: 9 if there the param value is NaN

                self.cols[flag] = {  # TODO: create this with _add_column method
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
            if pname not in self.get_cols_by_type('all'):
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

    def _set_cols_from_json_file(self):
        """ The columns are set directly from the columns.json file """
        lg.info('-- SET ATTRIBUTES FROM JSON FILE --')
        if path.isfile(path.join(TMP, 'columns.json')):
            with open(path.join(TMP, 'columns.json'), 'r') as f:
                attr = json.load(f)
            self.cols = attr

    def get_col_type(self, column=''):
        ''' Return a list of column types associated to the column argument '''
        if column in self.cols:
            return self.cols[column]['types']
        else:
            return False

    def get_cols_by_type(self, column_types=[], discard_nan=False):
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
        try:
            prepaired_list = [(col_positions[x], x) for x in res]
        except Exception:
            raise ValidationError(
                'Some column in the columns.json file or '
                'self.cols object is not in the DataFrame'
            )
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

    def get_units(self, cols):
        return [self.cols[x]['unit'] for x in cols]

    def is_flag(self, flag):
        if flag[-7:] == FLAG_END and flag in self.get_cols_by_type(['param_flag', 'qc_param_flag']):
            return True
        else:
            return False

    def _set_df(self):
        """ it creates the self.df dataframe object
            taking into account if data.csv is created or not
        """
        lg.info('-- SET DF')
        try:
            delimiter=self.dialect.delimiter
        except:
            delimiter=','
        try:
            self.df = pd.read_csv(
                filepath_or_buffer=self.filepath_or_buffer,
                comment='#',
                delimiter=delimiter,
                skip_blank_lines=True,
                skipinitialspace=True,
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
                delimiter=delimiter,
                skip_blank_lines=True,
                skipinitialspace=True,
                engine='python',
                dtype=str,
                skiprows=self.skiprows
                # verbose=False
            )
            lg.info('>> PANDAS using \'python\' engine')
        # lg.info('\n\n>> DF: \n\n{}'.format(self.df))

    def _prep_df_columns(self):
        self.df.replace(r'\s', '', regex=True, inplace=True)  # cleans spaces: \r and \n are managed by read_csv
        aux_cols = self.df.columns.tolist()
        self.df.columns = self._sanitize_cols(self.df.columns)  # remove spaces from columns
        self.df.columns = self._map_col_names(self.df.columns)

        cur_cols = self.df.columns.tolist()
        for i in range(len(self.df.columns)):
            self.orig_cols[cur_cols[i]] = aux_cols[i]

        self._create_btlnbr_or_sampno_column()
        self._create_date_column()

    def _create_btlnbr_or_sampno_column(self):
        # TODO: create cols in self.cols with _add_column method and test it

        cols = self.df.columns.tolist()
        if 'BTLNBR' in cols and not 'SAMPNO' in cols:
            self.df['SAMPNO'] = self.df['BTLNBR']
            self.add_moves_element(
                'sampno_column_added',
                'SAMPNO column was automatically generated from the column BTLNBR'
            )
        elif not 'BTLNBR' in cols and 'SAMPNO' in cols:
            self.df['BTLNBR'] = self.df['SAMPNO']
            self.add_moves_element(
                'sampno_column_added',
                'BTLNBR column was automatically generated from the column SAMPNO'
            )
        elif not 'BTLNBR' in cols and not 'SAMPNO' in cols:
            self.df['BTLNBR'] = range(self.df.index.size)
            self.df['SAMPNO'] = range(self.df.index.size)
            self.add_moves_element(
                'sampno_btlnbr_columns_added',
                'BTLNBR, SAMPNO column was automatically generated from the column '
            )

    def _create_date_column(self):
        # TODO: check what happens with this columns in the cd_update and self.env.cols

        cols = self.df.columns.tolist()
        if 'DATE' not in cols:
            lg.info('-- CREATE DATE COLUMN')
            if 'YEAR' in cols and 'MONTH' in cols and 'DAY' in cols:
                try:
                    self.df = self.df.assign(
                        DATE=pd.to_datetime(self.df[['YEAR', 'MONTH', 'DAY']]).dt.strftime('%Y%m%d')
                    )
                except Exception as e:
                    raise ValidationError(
                        'DATE column, which is a required field, does not exist. Also, it could not be created'
                        ' from YEAR, MONTH and DAY columns possibly because some of the rows do not have any value.',
                        rollback=self.rollback
                    )
                self.add_moves_element(
                    'required_column_added',
                    'DATE column was automatically generated from the columns YEAR, MONTH and DAY'
                )
            elif 'DATE_YY' in cols and 'DATE_MM' in cols and 'DATE_DD' in cols:
                mapper = dict(zip(
                    ('DATE_YY', 'DATE_MM', 'DATE_DD'),
                    ('YEAR', 'MONTH', 'DAY')
                ))
                try:
                    self.df = self.df.assign(
                        DATE=pd.to_datetime(
                            self.df[['DATE_YY','DATE_MM','DATE_DD']].rename(columns=mapper)
                        ).dt.strftime('%Y%m%d')
                    )
                except Exception as e:
                    raise ValidationError(
                        'DATE column, which is a required field, does not exist. Also, it could not be created'
                        ' from DATE_YY, DATE_MM and DATE_DD columns possibly because some of the rows do not have any value.',
                        rollback=self.rollback
                    )
                self.add_moves_element(
                    'required_column_added',
                    'DATE column was automatically generated from the columns DATE_YY, DATE_MM and DATE_DD'
                )
            else:
                raise ValidationError(
                    'DATE column, which is a required field, does not exist. Also, it could not be built'
                    ' with other columns (usually year, month and day).',
                    rollback=self.rollback
                )

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
        if (not set(self.get_cols_by_type('all')).issuperset(REQUIRED_COLUMNS)):
            missing_columns = ', '.join(list(set(REQUIRED_COLUMNS) - set(self.get_cols_by_type('all'))))
            raise ValidationError(
                'Missing required columns in the file: [{}]'.format(missing_columns),
                rollback=self.rollback
            )

    def _sanitize_cols(self, names):
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
                columns = [re.sub(r'\b'+replace_with + 'F'+r'\b', orig_name + FLAG_END, c) for c in columns]
        return columns

    def _map_col_names(self, names):
        lg.info('-- MAP COL NAMES')
        result = [n.upper() for n in names]
        for m in COL_NAMES_MAPPING:
            result = self._replace_if_not_exists(result, m[0], m[1])
        for name in result:
            if name + 'F' in result:
                result = [re.sub(r'\b'+name + 'F'+r'\b', name + FLAG_END, r) for r in result]
        return result

    def _replace_nan_values(self):
        ''' Replaces the -990.0, -999.00, etc values to NaN.
            There will be strings and floats in the same column because NaN is considered a float64
            and this step should be before the numeric conversion
        '''
        lg.info('-- REPLACE MISSING VALUES (-999 >> NaN)')
        self.df_str = self.df.copy(deep=True)    # TODO: this has to be synchronized when seld.df is updated
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
            the same number of decimals (the maximum, zero in the right side is not taking into account)

            If a cell of a column with dtype=np.int8 is assigned to some int64 value, then the column
            is completely converted to int64
        '''
        self.df = self.df.apply(lambda x: pd.to_numeric(x, errors='ignore', downcast='integer'))

        # if the new values are float >> check the original string to make the rounding well

        # TODO: round with the original number of decimals >> float comparison
        #       I think this rounding can be made by df column

        self.df = self.df.round(5)


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
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not self.moves.empty:
            last_pos = self.moves.tail(1).index[0]
            self.moves.loc[last_pos + 1] = [date, action, '', '', '', '', '', '', '', description]  # fastest way to add a row at the end
        else:
            self.moves.loc[0] = [date, action, '', '', '', '', '', '', '', description]

    def recompute_cps(self):
        ''' Compute all the calculated parameters again. Mainly after a cruise data update

            NOTE: what should happen if some column cannot be computed?
                  - Check if it is plotted in order to remove the plots?
                  - Show a error message (now only a warning appears)
        '''
        lg.info('-- RECOMPUTE CP PARAMETERS')
        cp_params = self.env.cruise_data.get_cols_by_type('computed')
        for c in cp_params:
            del self.cols[c]
        cps_to_rmv = []
        for c in self.cp_param.proj_settings_cps:
            if c['param_name'] not in self.cols:  # exclude the computed parameters
                res = self.cp_param.add_computed_parameter({
                    'value': c['param_name'],
                    'prevent_save': True
                })
                if res.get('success', False) is False:
                    if c['param_name'] in self.env.cur_plotted_cols:
                        cps_to_rmv.append(c['param_name'])
        if cps_to_rmv != []:
            self.env.f_handler.remove_cols_from_qc_plot_tabs(cps_to_rmv)
        self.env.cruise_data.save_attributes()
