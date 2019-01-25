# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import
from ocean_data_qc.data_models.cruise_data_parent import CruiseDataParent
from ocean_data_qc.env import Environment


class CruiseDataAQC(CruiseDataParent):
    ''' This class use to manage the plain AQC files. This file can be come from
        csv file or whp csv file.

        TODO: Is this class really needed?
    '''
    env = CruiseDataParent.env