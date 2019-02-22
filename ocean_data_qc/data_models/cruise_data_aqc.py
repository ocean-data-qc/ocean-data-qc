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
    '''
    env = CruiseData.env

    def __init__(self, original_type='', working_dir=TMP):
        lg.info('-- INIT AQC')
        self.working_dir = working_dir
        self.filepath_or_buffer = path.join(self.working_dir, 'data.csv')  # TODO: original.csv should exists and be the same file??
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
        self._replace_nan_values()         # '-999' >> NaN
        self._convert_data_to_number()
        self._set_hash_ids()

    def set_cps(self):
        ''' Adds all the calculated parameters to the DF when the file is loaded in the application.
            The computed parameters from the attributes.json should be computed.

                NOTE: When the file is open the cps are copied from `custom_settings.json`
                    So we have all the CP we need in cps['proj_settings_cps']
        '''
        lg.info('-- SET COMPUTED PARAMETERS')
        cps_list = self.env.cruise_data.get_columns_by_type('computed')  # get already active cps in the attributes.json file (AQC)
        lg.warning('>> CP LIST: {}'.format(cps_list))
        for cp in cps_list:
            for c in self.env.cp_param.proj_settings_cps:
                if c['param_name'] == cp:
                    cp_to_compute = {
                        'computed_param_name': c['param_name'],
                        'eq': c['equation'],
                        'precision': c['precision'],
                    }
                    lg.info('>> PARAM TO COMPUTE: {}'.format(cp_to_compute))
                    self.compute_equation(cp_to_compute)
