# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.env import Environment


class ValidationError(Exception, Environment):
    env = Environment

    def __init__(self, value, rollback=False):
        lg.error('-- Validation error: {}'.format(value))
        self.value = value
        if rollback == 'cruise_data':
            self._cruise_data_rollback()

    def _cruise_data_rollback(self):
        self.env.cd_parent = None
        self.env.cp_param = None
        self.env.ob_files_handler.remove_tmp_folder()
        self.env.bk_bridge.show_default_cursor()

# TODO: create a CruiseDataValidationError class with the rollback included?

class ManualException(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(
            'MANUAL ERROR: {}'.format(self.value)
        )