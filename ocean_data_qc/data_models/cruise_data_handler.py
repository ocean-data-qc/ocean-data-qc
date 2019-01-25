# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.cruise_data_aqc import CruiseDataAQC
from ocean_data_qc.data_models.cruise_data_csv import CruiseDataCSV
from ocean_data_qc.data_models.cruise_data_whp import CruiseDataWHP
from ocean_data_qc.data_models.cruise_data_update import CruiseDataUpdate
from ocean_data_qc.env import Environment

from os import path
try:
    import magic
except Exception:
    from winmagic import magic  # TODO: is this working on linux/osx?


class CruiseDataHandler(Environment):
    env = Environment

    def __init__(self):
        self.env.cd_handler = self
        lg.warning('-- INIT CRUISE DATA HANDLER')

        self.new_data = None

    def get_initial_columns(self):
        lg.info('-- GET INITIAL COLUMNS')
        cd_ob = self._init_cruise_data_ob()

        # TODO: I do not like setting the computed parameters like this, find another way?

        result = self.cp.set_computed_parameters()
        if result is False:
            lg.warning('Some computed parameter could not be computed')  # TODO: build something to recover the current project
        self.cp.add_all_possible_cps()

        columns = cd_ob.get_plotable_columns()
        lg.warning(columns)
        return columns

    def _init_cruise_data_ob(self):
        lg.warning('-- INIT CRUISE DATA OBJECT')
        ''' Check data type and instantiate the appropriate cruise data object
                whp and raw_csv >> process file from scratch
                aqc >> open directly
        '''
        if path.isfile(ORIGINAL_CSV):
            if self._is_plain_text(ORIGINAL_CSV):
                is_whp_format = self._is_whp_format(ORIGINAL_CSV)
                if path.isfile(DATA_CSV):
                    lg.warning('>> AQC')
                    return CruiseDataAQC(is_whp_format)      # open files directly
                else:
                    if is_whp_format:
                        lg.warning('>> WHP')
                        return CruiseDataWHP()  # generates data.csv from original.csv
                    else:
                        lg.warning('>> CSV')
                        return CruiseDataCSV()  # the data.csv should be a copy of original.csv, at the beggining at least
            else:
                raise Exception('The original.csv file should be plain text')



    def _is_plain_text(self, csv_path=''):
        ''' The original.csv file should be a normal raw csv file '''
        file_type = magic.from_file(csv_path, mime=True)
        lg.warning(file_type)
        if file_type != 'text/plain':
            return False
        else:
            return True

    def _is_whp_format(self, csv_path=None):
        ''' Open the file and checks if comply to the WHP format requirements '''

        if path.isfile(csv_path):
            with open(csv_path, 'rt', encoding="ascii", errors="surrogateescape") as f:
                raw_data = f.read()
        else:
            raise FileNotFoundError('The file was not found: {}'.format(csv_path))

        if raw_data.startswith('BOTTLE'):
            if raw_data.endswith('END_DATA'):
                return True
            elif raw_data.split('\n')[-1].startswith('END_DATA'):
                return True     # has weird end_data
            elif raw_data.split('\n')[-2].startswith('END_DATA'):
                return True     # has weird end_data 2

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