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
from ocean_data_qc.data_models.computed_parameter import ComputedParameter
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.env import Environment

from os import path
try:
    import magic
except Exception:
    try:
        from winmagic import magic  # TODO: is this working on linux/osx?
                                #       because I would need only one import
    except:
        import mimetypes


class CruiseDataHandler(Environment):
    env = Environment

    def __init__(self):
        self.env.cd_handler = self

    def get_cruise_data_columns(self):
        lg.info('-- GET CRUISE DATA COLUMNS')
        lg.warning('>> SELF.ENV.CRUISE_DATA: {}'.format(self.env.cruise_data))
        if self.env.cruise_data is None:
            self._init_cruise_data()
        params = self.env.cruise_data.get_columns_by_type('param', discard_nan=True)
        if len(params) == 0:
            raise ValidationError(
                'There should be at least one parameter with data, '
                'in addition to the required columns and the parameters that'
                ' should not have a QC column associated.',
                rollback='cruise_data'
            )
        d = {
            'cps': self.env.cruise_data.get_columns_by_type('computed'),
            'cols': self.env.cruise_data.get_columns_by_type(
                ['param', 'param_flag', 'qc_param_flag', 'computed'],
                discard_nan=True
            ),
            'params': params
        }
        return d

    def _init_cruise_data(self):
        ''' Checks data type and instantiates the appropriate cruise data object
                `whp` and `raw_csv` (csv) >> process file from scratch and validate data
                `aqc` >> open directly
        '''
        lg.info('-- INIT CRUISE DATA OBJECT')
        original_path = path.join(TMP, 'original.csv')
        if path.isfile(original_path):
            if self._is_plain_text(original_path):
                cd = None
                is_whp_format = self._is_whp_format(original_path)
                if path.isfile(path.join(TMP, 'data.csv')):
                    if is_whp_format:
                        cd = CruiseDataAQC(
                            original_type='whp',        # TODO: the original type should be saved in the setting.json somewhere
                        )
                    else:
                        cd = CruiseDataAQC(original_type='csv')
                else:
                    if is_whp_format:
                        cd = CruiseDataWHP()  # generates data.csv from original.csv
                    else:
                        cd = CruiseDataCSV()  # the data.csv should be a copy of original.csv, at the beggining at least
            else:
                raise ValidationError(
                    'The file to open should be a CSV file.'
                    ' That is a plain text file with comma separate values.',
                    rollback='cruise_data'
                )
            self.env.cruise_data = cd
            ComputedParameter()
        else:
            raise ValidationError(
                'The file could not be open',
                rollback='cruise_data'
            )

    def _init_cruise_data_aux(self):
        ''' Checks data type and instantiates the appropriate cruise data object in order to create the
                objects to make comparisons and update the current files
                `whp` and `raw_csv` (csv) >> process file from scratch and validate data
                `aqc` >> open directly
        '''
        lg.info('-- INIT CRUISE DATA OBJECT UPD')
        original_path = path.join(UPD, 'original.csv')
        if path.isfile(original_path):
            if self._is_plain_text(original_path):
                cd = None
                is_whp_format = self._is_whp_format(original_path)
                if path.isfile(path.join(UPD, 'data.csv')):
                    if is_whp_format:
                        cd = CruiseDataAQC(
                            original_type='whp',        # TODO: the original type should be saved in the setting.json somewhere
                            working_dir=UPD
                        )
                    else:
                        cd = CruiseDataAQC(
                            original_type='csv',
                            working_dir=UPD
                        )
                else:
                    if is_whp_format:
                        cd = CruiseDataWHP(working_dir=UPD)  # generates data.csv from original.csv
                    else:
                        cd = CruiseDataCSV(working_dir=UPD)  # the data.csv should be a copy of original.csv, at the beggining at least
            else:
                raise ValidationError(
                    'The file to open should be a CSV file.'
                    ' That is a plain text file with comma separate values.',
                    rollback='cruise_data_update'
                )
            self.env.cd_aux = cd
        else:
            raise ValidationError(
                'The file could not be open',
                rollback='cruise_data_update'
            )

    def _is_plain_text(self, csv_path=''):
        ''' The original.csv file should be a normal raw csv file '''
        try:
            file_type = magic.from_file(csv_path, mime=True)
        except:
            file_type = mimetypes.guess_type(csv_path)[0]
        if file_type != 'text/plain' and file_type != 'text/csv':
            return False
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
        self._init_cruise_data_aux()  # self.env.cd_aux is set here
        CruiseDataUpdate()            # self.env.cd_update uses cd_aux to make comparisons
        compared_data = self.env.cd_update.get_compared_data()
        return compared_data

    def get_different_values(self):
        return {
            'diff_values': self.env.cd_update.get_different_values()
        }

    def update_from_csv(self, args={}):
        lg.info('-- UPDATE FROM CSV --')
        lg.info('>> ARGS: {}'.format(args))
        if self.env.cd_update != None:
            if 'selected' in args:
                if args['selected'] is True:
                    self.env.cd_update.update_data_from_csv(args)
                    self.env.cd_update = None
                    return {'success': True}
                else:
                    self.env.cd_update.discard_changes()
                    self.env.cd_update = None