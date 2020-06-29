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
import re


class CruiseDataWHP(CruiseData):
    ''' This class use to manage the plain CSV files (with WHP format)
    '''
    env = CruiseData.env

    def __init__(self, working_dir=TMP, cd_aux=False, cd_update=False):
        lg.info('-- INIT CD WHP')
        if not cd_update:
            self.env.cruise_data = self
        else:
            self.env.cd_aux = self
        self.rollback = 'cd' if cd_aux is False else 'cd_update'
        self.working_dir = working_dir
        self.filepath_or_buffer = path.join(working_dir, 'original.csv')
        self.skiprows = 1
        self._sanitize_original_csv()
        super(CruiseDataWHP, self).__init__(original_type='whp', cd_aux=cd_aux)
        self.load_file()

    def _sanitize_original_csv(self):
        try:
            lg.info('-- TRYING TO SANITIZE UGLY EXCEL ARTIFACTS IN WHP FILES')
            with open(self.filepath_or_buffer, 'r', errors='surrogateescape') as f:
                trim_excel_artifacts = re.compile(r'[\n\r][\s\"]*')
                buf = trim_excel_artifacts.sub('\n', f.read())
                buf = re.sub(r'[\n\r]END_DATA[\s\S]*', '\nEND_DATA', buf)
            with open(self.filepath_or_buffer, 'w', errors='surrogateescape') as f:
                f.write(buf)
        except Exception as e:
            raise ValidationError(
                'Error trying to sanitize ugly excel artifacts in WHP files: {}'.format(e),
                rollback=self.rollback
            )

    def _validate_original_data(self):               # TODO: this should be in each cruise data class
        ''' Checks if all the rows have the same number of elements '''
        lg.info('-- CHECK DATA FORMAT (WHP)')
        with open(self.filepath_or_buffer, newline='', errors='surrogateescape') as csvfile:
            spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')          # TODO: ignore comments with #
            first_len = -1
            row_number = 1
            header = True
            trim_excel_artifacts = re.compile(r'^[\s\"]*')
            for row in spamreader:
                row[0] = trim_excel_artifacts.sub('', row[0])
                if not(row[0].startswith('BOTTLE') or row[0].startswith('END_DATA') or row[0].startswith('#')):
                    if header is True and '' in row:
                        csvfile.close()
                        raise ValidationError(
                            'Some header column name is missing: FILE ROW = {} | COL = {}'.format(
                                row_number, row.index('') + 1
                            ),
                            rollback='cd'
                        )
                        break                               # interrupt for loop
                    if header is True:
                        header = False
                    if first_len == -1:
                        first_len = len(row)
                    else:
                        if first_len != len(row):    # TODO: empty fields in the csv should be filled by NaN values
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
        lg.info('-- LOAD FILE WHP >> FROM SCRATCH')
        self._set_cols_from_scratch()  # the dataframe has to be created
        self._validate_required_columns()
        self._init_basic_params()
        self._replace_nan_values()         # '-999' >> NaN
        self._convert_data_to_number()
        self._validate_flag_values()
        self._set_hash_ids()
        self._set_cps()
        self._manage_empty_cols()
        if not self.cd_aux:
            self.save_tmp_data()

    def _set_cps(self):
        ''' Adds all the calculated parameters to the DF
            when the file is loaded in the application.

                NOTE: When the file is open the cps are copied from `custom_settings.json`
                      So we have all the CP we need in cps['proj_settings_cps']
        '''
        lg.info('-- SET COMPUTED PARAMETERS (WHP)')
        for c in self.cp_param.proj_settings_cps:
            if c['param_name'] not in self.cols:
                self.cp_param.add_computed_parameter({
                    'value': c['param_name'],
                    'prevent_save': True  # to avoid save_col_attribs all the times, once is enough
                })
        self.save_col_attribs()