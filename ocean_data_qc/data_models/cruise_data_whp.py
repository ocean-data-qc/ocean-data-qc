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


class CruiseDataWHP(CruiseData):
    ''' This class use to manage the plain CSV files (with WHP format)
    '''
    env = CruiseData.env

    def __init__(self):
        lg.warning('-- INIT CD WHP')
        self.filepath_or_buffer = ORIGINAL_CSV
        self.skiprows = 1
        super(CruiseDataWHP, self).__init__(original_type='whp')

    def _validate_original_data(self):               # TODO: this should be in each cruise data class
        ''' Checks if all the rows have the same number of elements '''
        lg.info('-- CHECK DATA FORMAT (WHP)')
        with open(ORIGINAL_CSV, newline='') as csvfile:
            spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')          # TODO: ignore comments with #
            first_len = -1
            row_number = 1
            header = True
            for row in spamreader:
                if not(row[0].startswith('BOTTLE') or row[0].startswith('END_DATA') or row[0].startswith('#')):
                    if header is True and '' in row:
                        csvfile.close()
                        raise ValidationError(
                            'Some header column name is missing: FILE ROW = {} | COL = {}'.format(
                                row_number, row.index('') + 1
                            ),
                            rollback='cruise_data'
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
                                rollback='cruise_data'
                            )
                            break                               # interrupt for loop
                row_number += 1

    def load_file(self):
        lg.info('-- LOAD FILE WHP >> FROM SCRATCH')
        self._set_attributes_from_scratch()  # the dataframe has to be created
        self._validate_required_columns()
        self._replace_missing_values()         # '-999' >> NaN
        self._init_early_calculated_params()
        self._convert_data_to_number()
        self._set_hash_ids()
        self.save_tmp_data()

