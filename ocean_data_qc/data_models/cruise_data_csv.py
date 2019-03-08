# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data import CruiseData
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.env import Environment

import csv
from shutil import copyfile


class CruiseDataCSV(CruiseData):
    ''' This class is used to manage the plain CSV files (non-WHP format)
    '''
    env = CruiseData.env

    def __init__(self, working_dir=TMP, cd_aux=False):
        lg.info('-- INIT CSV')
        self.rollback = 'cd' if self.cd_aux is False else 'cd_update'
        self.working_dir = working_dir
        copyfile(
            path.join(self.working_dir, 'original.csv'),
            path.join(self.working_dir, 'data.csv')
        )
        self.filepath_or_buffer = path.join(self.working_dir, 'data.csv')
        self.skiprows = 0
        super(CruiseDataCSV, self).__init__(original_type='csv', cd_aux=cd_aux)
        self.load_file()

    def _validate_original_data(self):
        ''' Checks if all the rows have the same number of elements '''
        lg.info('-- CHECK DATA FORMAT (CSV)')
        with open(self.filepath_or_buffer, newline='', errors='surrogateescape') as csvfile:
            spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
            first_len = -1
            row_number = 1
            for row in spamreader:
                if row_number == 1 and '' in row:
                    csvfile.close()
                    raise ValidationError(
                        'Some header column name is missing: ROW = {} | COL = {}'.format(
                            row_number, row.index('') + 1
                        ),
                        rollback=self.rollback
                    )
                    break                               # interrupt for loop

                # NOTE: this code is used to check if all the rows have the same number
                #       of elements, if the cells are empty (",,") the value is fill with NaN

                if first_len == -1:
                    first_len = len(row)
                else:
                    if first_len != len(row):
                        csvfile.close()
                        raise ValidationError(
                            'There is an invalid number of fields ({}) in the row: {}.'
                            ' The number of header columns fields is: {}'.format(
                                len(row), row_number, first_len
                            ),
                            rollback=self.rollback
                        )
                        break                               # interrupt for loop
                row_number += 1

    def load_file(self):
        lg.info('-- LOAD FILE CSV >> FROM SCRATCH')
        self._set_cols_from_scratch()  # the dataframe has to be created
        self._validate_required_columns()
        self._replace_nan_values()         # '-999' >> NaN
        self._init_early_calculated_params()
        self._convert_data_to_number()
        self._sanitize_flags()
        self._set_hash_ids()
        self._set_cps()
        if not self.cd_aux:
            self.save_tmp_data()

    def _set_cps(self):
        ''' Adds all the calculated parameters to the DF
            when the file is loaded in the application.

                NOTE: When the file is open the cps are copied from `custom_settings.json`
                      So we have all the CP we need in cps['proj_settings_cps']
        '''
        lg.info('-- SET COMPUTED PARAMETERS (CSV)')
        for c in self.cp_param.proj_settings_cps:
            if c['param_name'] not in self.cols:
                self.cp_param.add_computed_parameter({
                    'value': c['param_name'],
                    'prevent_save': True  # to avoid save_attributes all the times, once is enough
                })
        self.save_attributes()
