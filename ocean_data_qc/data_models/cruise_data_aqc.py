# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data_parent import CruiseDataParent

import csv

class CruiseDataAQC(CruiseDataParent):
    ''' This class use to manage the plain AQC files. This file can be come from
        csv file or whp csv file.

        TODO: Is this class really needed?
    '''
    env = CruiseDataParent.env

    def _check_data_format(self, csv_path=''):
        ''' Checks if all the rows have the same number of elements

            TODO: the original.csv of this class can be a raw csv file or a WHP
        '''
        lg.warning('-- CHECK DATA FORMAT')
        with open(csv_path, newline='') as csvfile:
            spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
            first_len = -1
            row_number = 1
            for row in spamreader:
                row_number += 1
                if first_len == -1:
                    first_len = len(row)
                else:
                    if first_len != len(row):
                        raise Exception(
                            'Invalid number of fields ({}), row: {} '
                            '| Number of header columns fields: {}'.format(
                                len(row), row_number, first_len
                            )
                        )

    def load_file(self):
        lg.warning('-- LOAD FILE AQC (cruise_data_aqc)')
        self._set_moves()
        self._load_from_files()
