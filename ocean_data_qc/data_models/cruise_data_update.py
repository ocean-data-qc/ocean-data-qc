# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.data_models.cruise_data_parent import CruiseDataParent
from ocean_data_qc.data_models.computed_parameter import ComputedParameter

from datetime import datetime
import csv
import json
import os
import pandas as pd
import numpy as np
from os import path
from six.moves import cStringIO as StringIO

class CruiseDataUpdate(CruiseDataParent):
    """ This class creates objects used to update data.csv
        with new columns, values or rows. Before that we should process
        the new original.csv and if there is any error, all the actions are resetted
    """

    def __init__(self, old_data=False):
        """ the original __init__ is overriden here
            (the super method is not called) """
        lg.info('-- CRUISE DATA UPDATE INIT')

        self.is_whp_format = False
        self.df = None
        self.moves = None
        self.cols = {}

        self.old_data = old_data
        self._check_whp_format(UPDATE_CSV)
        self._set_df()
        self._set_attributes_from_scratch()
        self._validate_required_columns()
        self._replace_missing_values()
        self._convert_data_to_number()
        self._set_hash_ids()

        self._compute_comparison()

    def _set_df(self):
        lg.info('-- SET DF')
        skiprows = 0
        if self.is_whp_format:  # WHP format
            self.format = 'whp'
            skiprows = 1
        else:
            self.format = 'csv'                                     # flat CSV format
            skiprows = 0

        self.df = pd.read_csv(
            filepath_or_buffer=UPDATE_CSV,
            comment='#',
            delimiter=',',
            skip_blank_lines=True,
            engine='c',                 # engine='python' is more versatile, 'c' is faster
            dtype=str,                  # useful to make some replacements before casting to numeric values
            skiprows=skiprows,
            # verbose=False             # indicates the number of NA values placed in non-numeric columns
        )
        self.df.replace('\s', '', regex=True, inplace=True)  # cleans spaces: \r and \n are managed by read_csv
        self.df.columns = self._sanitize(self.df.columns)    # remove spaces from columns

    def _compute_comparison(self):
        """ compare the new original.csv with the old one
            the results are showed to the user
            in order to ask for the confirmation """
        # new object attributes to check modifications
        self.modified = False
        self.new_columns = []
        self.removed_columns = []
        self.new_rows = 0
        self.removed_rows = 0
        self.different_values_number = 0
        self.different_values_pairs = []

        if self.old_data is False:
            lg.info('ERROR: old_data is False >> Nothing to do')
        else:
            self._compute_columns_comparison()
            self._compute_rows_comparison()
            self._compute_values_comparison()

            if self.new_columns or self.removed_columns or self.new_rows or self.removed_rows or self.different_values_number:
                self.modified = True
                lg.info('>> THERE ARE CHANGES!!')

    def _compute_columns_comparison(self):
        new_cols = self.get_columns_by_type(['param', 'param_flag', 'qc_param_flag'])
        old_data_cols = self.old_data.get_columns_by_type(['param', 'param_flag', 'qc_param_flag'])
        new_cols.sort()                # sort() order the list permanently
        old_data_cols.sort()
        if new_cols != old_data_cols:  # it compares order and values
            for column in new_cols:
                if column not in old_data_cols:
                    self.new_columns.append(column)
            for column in old_data_cols:
                if column not in new_cols:
                    self.removed_columns.append(column)

        # Checks if the removed columns are plotted
        self.removed_columns_plotted = False
        for rc in self.removed_columns:
            if rc in self.env.cur_plotted_cols:
                self.removed_columns_plotted = True

        # lg.info('>> COLUMNS COMPARISON: new {}, removed {}'.format(self.new_columns, self.removed_columns))

    def _compute_rows_comparison(self):
        new_hash_id_list = self.df.index.tolist()
        old_has_id_list = self.old_data.df.index.tolist()

        # a frozenset is more efficient than a list or than a simple set
        difference_list = frozenset(old_has_id_list).difference(new_hash_id_list)
        self.removed_rows = len(difference_list)
        self.removed_rows_hash_list = difference_list
        lg.info('>> REMOVED ROWS: {}'.format(len(difference_list)))

        reverse_difference_list = frozenset(new_hash_id_list).difference(old_has_id_list)
        self.new_rows = len(reverse_difference_list)
        self.new_rows_hash_list = reverse_difference_list
        lg.info('>> NEW ROWS: {}'.format(len(reverse_difference_list)))

    def _compute_values_comparison(self):
        """ Comparison of values between both DF
            If there are removed rows or columns the values comparison is not possible
            So I need the intersections of rows and columns to make sure that they exist in both df """
        lg.info('-- COMPUTE VALUES COMPARISON')
        RESET_FLAG_VALUE = 2
        columns = list(frozenset(self.get_columns_by_type(['all'])).intersection(self.old_data.get_columns_by_type(['all'])))

        new_hash_id_list = self.df.index.tolist()
        old_has_id_list = self.old_data.df.index.tolist()
        hash_ids_rows = list(frozenset(old_has_id_list).intersection(new_hash_id_list))

        for hash_id in hash_ids_rows:
            for column in columns:
                new_scalar = self.df.loc[hash_id, column]
                old_scalar = self.old_data.df.loc[hash_id, column]

                # and if they are new_scalar = 'str' and old_scalar = NaN ?????
                nan_different = False
                if isinstance(new_scalar, str) or isinstance(old_scalar, str):
                    if not isinstance(new_scalar, str) and isinstance(old_scalar, str):
                        nan_different = True
                    if isinstance(new_scalar, str) and not isinstance(old_scalar, str):
                        nan_different = True
                elif ((not np.isnan(new_scalar) and np.isnan(old_scalar)) or (np.isnan(new_scalar) and not np.isnan(old_scalar))):
                    nan_different = True

                if not self._are_equal(new_scalar, old_scalar):
                    if nan_different or not (np.isnan(new_scalar) and np.isnan(old_scalar)):
                        if (hash_id, column) not in self.different_values_pairs: # is this possible?
                            self.different_values_number += 1
                            self.different_values_pairs.append((hash_id, column))
                            lg.info('>> POS: ({}, {}) - NEW VALUE: {} - OLD VALUE: {}'.format(
                                hash_id, column, new_scalar, old_scalar
                            ))

                        # the column flag has to be reset by default
                        # unless the whole flag column was added or the flag cell was modified
                        if column in self.old_data.get_columns_by_type(['param']):
                            flag_column = column + '_FLAG_W'
                            if flag_column in self.old_data.get_columns_by_type(['param_flag']):
                                if (hash_id, flag_column) not in self.different_values_pairs:
                                    if flag_column in self.get_columns_by_type(['param_flag']):
                                        if flag_column not in self.new_columns:
                                            if self.df.loc[hash_id, flag_column] != RESET_FLAG_VALUE:
                                                self.different_values_number += 1
                                                self.different_values_pairs.append((hash_id, column))
                                                self.df.loc[hash_id, flag_column] = RESET_FLAG_VALUE
                                                lg.info('>> FLAG RESET POS: HASH: {} FLAG COLUMN: {}'.format(
                                                    hash_id, flag_column
                                                ))

    def _are_equal(self, val1, val2):
        # lg.info('-- VALUE COMPARISON')
        # Numpy types: https://docs.scipy.org/doc/numpy/user/basics.types.html

        # TODO: change implementation, use np.isclose() for the entire columns, check what
        #       would happen with strings >>> np.chararray() ??
        # TODO: cast if they have different type (int != float) ?? Is it needed?
        # TODO: and if they are "str vs float" or "str vs int" ??

        if isinstance(val1, (str)) and isinstance(val1, (str)):
            return val1 == val2

        np_int = (np.int8, np.int16, np.int32, np.int64)
        if isinstance(val1, np_int) and isinstance(val1, np_int):
            return val1 == val2

        eps64 = np.finfo(np.float64).eps
        # if np.absolute(val1 - val2) < eps64:    # the same as np.isclose()
        equal = np.isclose(
            np.array([val1], dtype=np.float64),  # cast to float64
            np.array([val2], dtype=np.float64),
            equal_nan=False,
            atol=0.0,
            rtol=eps64
        )[0]

        return equal

    def get_different_values(self):
        """ Structure of the different_values dictionary:
            {
                'param_name': {
                    'stt': [
                        {
                            'hash': '...',
                            'flag':
                            'old_param_value':
                            'new_param_value':
                            'old_flag_value':
                            'new_flag_value':

                        },
                        {
                            ...
                        }
                    ]
                }
            }
        """
        lg.info('-- GET DIFFERENT VALUES')
        HASH = 0
        COL = 1
        self.diff_values = {}
        for pair in self.different_values_pairs:
            stt = str(int(self.df.loc[pair[HASH], 'STNNBR']))  # the stt should be always integers?
            col = pair[COL]
            hash_id = pair[HASH]
            param = ''
            if FLAG_END in col:
                param = col[:-7]
                flag = col
            else:
                param = col
                flag = col + FLAG_END

            if param not in self.diff_values:
                self.diff_values[param] = {}
            if stt not in self.diff_values[param]:
                self.diff_values[param][stt] = []

            exist = len([val for val in self.diff_values[param][stt] if val["hash_id"] == hash_id])
            if exist == 0:
                aux = {
                    'old_param_value': self.old_data.df.loc[hash_id, param],
                    'new_param_value': self.df.loc[hash_id, param],
                    'old_flag_value': self.old_data.df.loc[hash_id, flag],
                    'new_flag_value': self.df.loc[hash_id, flag],
                }

                # change = [flag, param, both ]
                for key in aux:
                    lg.info('>> VALUE: {} | TYPE: {}'.format(aux[key], type(aux[key])))
                    if isinstance(aux[key], (np.int8, np.int16, np.int32, np.int64)):  # they cannot be serialized with json.dumps
                        aux[key] = int(aux[key])
                    elif isinstance(aux[key], np.float64) and np.isnan(aux[key]):
                        aux[key] = False
                    elif isinstance(aux[key], np.float64):
                        aux[key] = float(aux[key])  # 15 decimal figures survive

                # TODO: fix these comparisons as well
                if aux['old_param_value'] != aux['new_param_value'] and aux['old_flag_value'] != aux['new_flag_value']:
                    changed = 'both'
                elif aux['old_param_value'] != aux['new_param_value']:
                    changed = 'param'
                elif aux['old_flag_value'] != aux['new_flag_value']:
                    changed = 'flag'

                aux.update({
                    'hash_id': hash_id,
                    'castno': str(self.old_data.df.loc[hash_id, 'CASTNO']),
                    'btlnbr': str(self.old_data.df.loc[hash_id, 'BTLNBR']),
                    'latitude': str(self.old_data.df.loc[hash_id, 'LATITUDE']),
                    'longitude': str(self.old_data.df.loc[hash_id, 'LONGITUDE']),
                    'changed': changed,
                })
                for key in list(aux.keys()):
                    lg.info('>> AUX [{} =: {} | TYPE: {}'.format(key, aux[key], type(aux[key])))

                self.diff_values[param][stt].append(aux)
            elif exist > 1:
                lg.error('Repeated row for that value: PARAM: {} | HASH_ID: {}'.format(param, hash_id))

        self.diff_values = json.dumps(self.diff_values, sort_keys=True)
        lg.info('>> DIFF VALUES JSON STRING: {}'.format(self.diff_values))
        return self.diff_values

    def discard_changes(self):
        """ new.csv file is removed """
        if path.isfile(path.join(TMP, 'new.csv')):
            os.remove(path.join(TMP, 'new.csv'))

    def update_data_from_csv(self, params={}):
        """ Update and save columns, rows and values from the new data object (self) created
            from an updated WHP csv file. The changes accepted by the user are updated to the old_data object

            The parameters sent (params dictionary) are boolean values, for example if everything should be saved:
            params = {
                'new_columns': true,
                'removed_columns': true,
                'new_rows': true,
                'removed_rows': true,
                'different_values_number': true,
                'diff_values': {}     # dict with the accepted values
            }
        """
        lg.info('-- UPDATE DATA FROM CSV --')

        if params != {}:
            self._update_rows(
                new_rows_checked=params['new_rows'],
                removed_rows_checked=params['removed_rows']
            )
            self._update_columns(
                new_columns_checked=params['new_columns'],
                removed_columns_checked=params['removed_columns']
            )
            diff_values = params['diff_values'] if 'diff_values' in params else {}
            self._update_values(
                different_values_number=params['different_values_number'],
                diff_values=diff_values
            )

        self.old_data._replace_missing_values()     # -999 >> NaN

        self._update_moves()
        self.old_data.save_tmp_data()
        self._rename_files()

    def _update_rows(self, new_rows_checked=False, removed_rows_checked=False):
        lg.info('-- Updating rows')
        if new_rows_checked is True and self.new_rows_hash_list != []:
            for hash_id in self.new_rows_hash_list:
                columns = list(frozenset(self.get_columns_by_type(['all'])).intersection(self.old_data.get_columns_by_type(['all'])))
                self.old_data.df.loc[hash_id, columns] = self.df.loc[hash_id, columns].tolist()
            lg.info('>> Rows added: {}'.format(list(self.new_rows_hash_list)))

        if removed_rows_checked is True and self.removed_rows_hash_list != []:
            for hash_id in self.removed_rows_hash_list:
                self.old_data.df = self.old_data.df.drop(hash_id)  # assignation needed
            lg.info('>> Rows removed: {}'.format(list(self.removed_rows_hash_list)))

    def _update_columns(self, new_columns_checked=False, removed_columns_checked=False):
        """ It updates the old_data object adding or removing columns
            that are in the new object (self in this case)
        """
        lg.info('-- UPDATE COLUMNS')

        # I have to add the columns manually because other way I cannot assign the units well in the right position
        if new_columns_checked is True or removed_columns_checked is True:
            if new_columns_checked is True and self.new_columns != []:
                for column in self.new_columns:
                    self.old_data.cols[column] = self.cols[column]      # TODO: is it copied the full element or only a reference?
                    if len(self.df) == len(self.old_data.df):           # TODO: else raise error
                        self.old_data.df[column] = self.df[column].tolist()

            if removed_columns_checked is True and self.removed_columns != []:
                for column in self.removed_columns:
                    if column in self.old_data.get_columns_by_type(['param']):
                        column_flag = column + '_FLAG_W'
                        if column_flag not in self.removed_columns:
                            if column_flag in self.old_data.get_columns_by_type(['param_flag']):
                                del self.old_data.cols[column_flag]  # if the param column is deleted, then the flag is also deleted
                                del self.old_data.df[column_flag]    # if they are not in the removed columns
                        del self.old_data.cols[column]
                        del self.old_data.df[column]
                    if column in self.old_data.get_columns_by_type(['param_flag']):
                        param = column[:-7]  # to delete '_FLAG_W'
                        if param in self.old_data.get_columns_by_type(['param']):
                            self.old_data.df[column] = 9  # resetting to 9 instead of deleting the flag column
                        else:
                            del self.old_data.cols[column]
                            del self.old_data.df[column]

    def _update_values(self, different_values_number=0, diff_values={}):
        """ update the values in the self.old_data object with the new ones
            the flag associated to the columns has to be reset """
        lg.info('-- UPDATING VALUES')
        if different_values_number is True:  # update all the values
            for hash_id, column in self.different_values_pairs:
                self.old_data.df.loc[hash_id, column] = self.df.loc[hash_id, column]
        else:
            if diff_values != {} and diff_values is not False:
                for param in diff_values:
                    for stt in diff_values[param]:
                        for elem in diff_values[param][stt]:
                            lg.info('>> STT ELEM: {}'.format(elem))
                            if elem['param_checked'] is True:
                                self.old_data.df.loc[elem['hash_id'], param] = self.df.loc[elem['hash_id'], param]
                            if elem['flag_checked'] is True:
                                flag = param + '_FLAG_W'
                                self.old_data.df.loc[elem['hash_id'], flag] = self.df.loc[elem['hash_id'], flag]

    def _update_moves(self):
        """ the log of actions is updated with the new operations """
        lg.info('-- Updating moves')
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if len(self.new_columns) > 0:
            action = '[ADD] Columns'
            description = 'Added columns: {}'.format(self.new_columns)
            self.old_data.add_moves_element(action, description)

        if len(self.removed_columns) > 0:
            action = '[DEL] Columns'
            description = 'Deleted columns: {}'.format(self.removed_columns)
            self.old_data.add_moves_element(action, description)

        if self.new_rows > 0:
            action = '[ADD] Rows'
            description = 'Added rows: {}'.format(self.new_rows)
            self.old_data.add_moves_element(action, description)

        if self.removed_rows > 0:
            action = '[DEL] Rows'
            description = 'Deleted rows: {}'.format(self.removed_rows)
            self.old_data.add_moves_element(action, description)

        if self.different_values_number > 0:
            action = '[UPD] Values'
            description = 'Updated values: {}'.format(self.different_values_number)
            self.old_data.add_moves_element(action, description)

            # self.different_values_pairs = []

    def _rename_files(self):
        if self.modified is True:
            if path.isfile(path.join(TMP, 'original.old.csv')):
                os.remove(path.join(TMP, 'original.old.csv'))
            os.rename(
                path.join(TMP, 'original.csv'),
                path.join(TMP, 'original.old.csv')
            )
            os.rename(
                path.join(TMP, 'new.csv'),
                path.join(TMP, 'original.csv')
            )
        else:
            if path.isfile(path.join(TMP, 'new.csv')):
                os.remove(path.join(TMP, 'new.csv'))

        # TODO: raise error if the file is in use (windows) or wrong permissions (unix)
