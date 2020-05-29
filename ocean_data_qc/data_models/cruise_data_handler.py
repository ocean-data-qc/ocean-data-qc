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
import re

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
        if self.env.cruise_data is None:
            self._init_cruise_data()
        params = self.env.cruise_data.get_cols_by_attrs('param', discard_nan=True)
        if len(params) == 0:
            raise ValidationError(
                'There should be at least one parameter with data, '
                'in addition to the required columns and the parameters that'
                ' should not have a QC column associated.',
                rollback='cd'
            )
        d = {
            'cps': self.env.cruise_data.get_cols_by_attrs('computed'),
            'cols': self.env.cruise_data.get_cols_by_attrs(
                ['param', 'flag', 'computed'],
                discard_nan=True
            ),
            'params': params
        }
        return d

    def _init_cruise_data(self, update=False):
        ''' Checks data type and instantiates the appropriate cruise data object
                `whp` and `raw_csv` (csv) >> process file from scratch and validate data
                `aqc` >> open directly
                @update - boolean, whether the instantiated object is to make comparisons or not
        '''
        lg.info('-- INIT CRUISE DATA OBJECT')
        if update:
            rollback = 'cd_update'
            working_dir = UPD
            cd_aux = True
        else:
            rollback = 'cd'
            working_dir = TMP
            cd_aux = False
        original_path = path.join(working_dir, 'original.csv')

        if path.isfile(original_path):
            if self._is_plain_text(original_path):
                cd = None
                is_whp_format = self._is_whp_format(original_path)
                if path.isfile(path.join(working_dir, 'data.csv')):   # aqc or pending session
                    original_type = 'whp' if is_whp_format else 'csv'
                    cd = CruiseDataAQC(
                        original_type=original_type,
                        working_dir=working_dir,
                        cd_aux=cd_aux
                    )
                else:
                    if is_whp_format:
                        # generates data.csv from original.csv
                        cd = CruiseDataWHP(working_dir=working_dir, cd_aux=cd_aux)
                    else:
                        # the data.csv should be a copy of original.csv, at the beggining at least
                        cd = CruiseDataCSV(working_dir=working_dir, cd_aux=cd_aux)
            else:
                raise ValidationError(
                    'The file to open should be a CSV file.'
                    ' That is a plain text file with comma separate values.',
                    rollback=rollback
                )
            if not update:
                self.env.cruise_data = cd
            else:
                self.env.cd_aux = cd
        else:
            raise ValidationError(
                'The file could not be open',
                rollback=rollback
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
        self._init_cruise_data(update=True)  # self.env.cd_aux is set here
        CruiseDataUpdate()                   # self.env.cd_update uses cd_aux to make comparisons
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

    def get_cruise_data_df_to_html(self):
        lg.info('-- GET CRUISE DATA DF TO HTML')
        df_aux = self.env.cruise_data.df.copy(deep=True)
        new_index = [x for x in range(self.env.cruise_data.df.index.size)]
        df_aux['NEW_INDEX'] = new_index
        df_aux.set_index(keys='NEW_INDEX', inplace=True)

        html = df_aux.to_html(
            classes='table table-striped user_select_all',
            # formatters={
            #     'EXPOCODE': lambda x: '<b>' + str(x) + '</b>'
            # },
            escape=False,
            justify='left',
            index_names=False,
            border=0,
            # columns=['EXPOCODE', 'STNNBR', 'DEPTH', 'SALNTY', 'SALNTY_FLAG_W']
        )

        # TODO: I did not find any better way to do this:
        html = html.replace('<th>', '<th class="rotate"><div><div><span>')
        html = html.replace('</th>', '</span></div></div>')

        # TODO: store in a tmp file. It should work faster
        return html
