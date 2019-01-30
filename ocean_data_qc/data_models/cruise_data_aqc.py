# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data_parent import CruiseDataParent
from ocean_data_qc.data_models.exceptions import ValidationError

import csv

class CruiseDataAQC(CruiseDataParent):
    ''' This class use to manage the plain AQC files. This file can be come from
        csv file or whp csv file.

        TODO: Is this class really needed?
    '''
    env = CruiseDataParent.env

    def __init__(self, original_type=''):
        lg.warning('-- INIT AQC')
        self.filepath_or_buffer = DATA_CSV
        self.skiprows = 0
        super(CruiseDataWHP, self).__init__(original_type=original_type)

    def _validate_original_data(self):
        ''' Checks if all the rows have the same number of elements

            In this case there is no need to check the data because
            was already checked when it was open the first time
        '''
        lg.warning('-- CHECK DATA FORMAT')

    def load_file(self):
        lg.warning('-- LOAD FILE AQC (cruise_data_aqc)')
        self._set_moves()
        self._load_from_files()


        # filepath_or_buffer = ''
        # skiprows = 0
        # data_exists = path.isfile(path.join(TMP, 'data.csv'))
        # lg.info('>> DATA EXISTS: {} | FROM SCRATCH: {} | IS WHP FORMAT: {}'.format(
        #     data_exists, from_scratch, self.is_whp_format)
        # )
        # if (data_exists is False or from_scratch) and self.is_whp_format:  # WHP format
        #     self.original_type= 'whp'
        #     skiprows = 1
        #     filepath_or_buffer = ORIGINAL_CSV
        # else:
        #     if data_exists is True and from_scratch is False:   # data.csv was previously saved
        #         self.original_type= 'whp'                             # TODO: actually I do not know the format here,
        #                                                         #       only that the project was open
        #         filepath_or_buffer = DATA_CSV
        #         skiprows = 0
        #     else:
        #         self.original_type= 'csv'                       # flat CSV format
        #         filepath_or_buffer = ORIGINAL_CSV
        #         skiprows = 0