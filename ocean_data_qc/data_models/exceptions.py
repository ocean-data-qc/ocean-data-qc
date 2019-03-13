# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *
import shutil
import os


class ValidationError(Exception, Environment):
    env = Environment

    def __init__(self, value, rollback=False):
        lg.error('-- Validation error: {}'.format(value))
        self.value = value
        if rollback == 'cd':
            self._cruise_data_rollback()
        elif rollback == 'cd_update':
            self._cruise_data_update_rollback()

    def _cruise_data_rollback(self):
        self.env.cruise_data = None
        self.env.f_handler.remove_tmp_folder()
        self.env.bk_bridge.show_default_cursor()

    def _cruise_data_update_rollback(self):
        self.env.cd_aux = None
        self.env.cd_update = None
        if os.path.isdir(UPD):
            shutil.rmtree(UPD)
        self.env.bk_bridge.show_default_cursor()


class UserError(Exception, Environment):
    def __init__(self, value):
        lg.error('-- User error: {}'.format(value))
        self.value = value

    def __str__(self):
        return repr(
            'USER ERROR: {}'.format(self.value)
        )


class Error(Exception, Environment):
    env = Environment

    def __init__(self, value, rollback=False):
        lg.error('{}'.format(value))
        self.value = value
        if rollback == 'cd':
            self._cruise_data_rollback()
        elif rollback == 'cd_update':
            self._cruise_data_update_rollback()

    def _cruise_data_rollback(self):
        self.env.cruise_data = None
        self.env.f_handler.remove_tmp_folder()
        self.env.bk_bridge.show_default_cursor()

    def _cruise_data_update_rollback(self):
        self.env.cd_aux = None
        self.env.cd_update = None
        if os.path.isdir(UPD):
            shutil.rmtree(UPD)
        self.env.bk_bridge.show_default_cursor()