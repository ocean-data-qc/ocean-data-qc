# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data_update import CruiseDataUpdate
from ocean_data_qc.env import Environment


class CruiseDataHandler(Environment):
    env = Environment

    def __init__(self):
        self.env.sh_cruise_data_handler = self
        self.new_data = None

    def compare_data(self):
        lg.info('-- COMPARE DATA')
        self.new_data = CruiseDataUpdate(self.env.sh_cruise_data)
        comparison_data = {
            'new_columns': self.new_data.new_columns,
            'removed_columns': self.new_data.removed_columns,
            'removed_columns_plotted': self.new_data.removed_columns_plotted,
            'new_rows': self.new_data.new_rows,
            'removed_rows': self.new_data.removed_rows,
            'different_values_number': self.new_data.different_values_number,
            'modified': self.new_data.modified
        }
        lg.info('>> COMPARISON DATA: {}'.format(comparison_data))
        return comparison_data

    def get_different_values(self):
        return {
            'diff_values': self.new_data.get_different_values()
        }

    def update_from_csv(self, args={}):
        lg.info('-- UPDATE FROM CSV --')
        lg.info('>> ARGS: {}'.format(args))
        if self.new_data != None:
            if 'selected' in args:
                if args['selected'] is True:
                    self.new_data.update_data_from_csv(args)
                    self.new_data = None
                    return {'success': True}
                else:
                    self.new_data.discard_changes()
                    self.new_data = None