# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import
from ocean_data_qc.data_models.cruise_data_aqc import CruiseDataAQC
from ocean_data_qc.data_models.cruise_data_csv import CruiseDataCSV
from ocean_data_qc.data_models.cruise_data_aqc import CruiseDataWHP
from ocean_data_qc.env import Environment


class CruiseDataParent(Environment):
    ''' This class is gathering all the common methods needed to manage
        the aqc, csv and whp files
    '''
    env = Environment