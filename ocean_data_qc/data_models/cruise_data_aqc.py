# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data import CruiseData
from ocean_data_qc.data_models.exceptions import ValidationError

import csv

class CruiseDataAQC(CruiseData):
    ''' This class use to manage the plain AQC files. This file can be come from
        csv file or whp csv file.

        TODO: Is this class really needed?
    '''
    env = CruiseData.env

    def __init__(self, original_type=''):
        lg.warning('-- INIT AQC')
        self.filepath_or_buffer = DATA_CSV
        self.skiprows = 0
        super(CruiseDataAQC, self).__init__(original_type=original_type)

    def _validate_original_data(self):
        ''' Checks if all the rows have the same number of elements

            In this case there is no need to check the data because
            was already checked when it was open the first time
        '''
        lg.info('-- CHECK DATA FORMAT')

    def load_file(self):
        lg.info('-- LOAD FILE AQC >> LOAD FROM FILES')
        self._set_attributes_from_json_file()
        self._replace_missing_values()         # '-999' >> NaN
        self._convert_data_to_number()
        self._set_hash_ids()
