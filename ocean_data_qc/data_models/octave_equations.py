# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import shutil
import sys
import fnmatch
import os
import pathlib
from datetime import datetime
import pandas as pd
import numpy as np
import seawater as sw
import importlib
from scipy import stats

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.env import Environment


class OctaveEquations(Environment):
    ''' This class is used for:
            * check octave path
            * set octave path manually
            * equations that can be used by octave

        NOTE: If one new method is added to this class, its string name should be
              added to the ComputedParameter class as well. This is to prevent from adding
              it to the local context (local_dict)
    '''
    env = Environment

    def __init__(self):
        lg.info('-- INIT OCTAVE EXECUTABLE')
        self.env.oct_eq = self

        self.oc = None
        self.oct_exe_path = False
        self.set_oct_exe_path()

    def guess_oct_exe_path(self):
        lg.info('-- GUESS OCT EXE PATH')
        if sys.platform == 'win32':
            base_octave = r'C:\Octave'
            if os.path.isdir(base_octave):
                try:
                    odir = sorted(os.listdir(base_octave), reverse=True)
                    for vdir in odir:
                        possible_paths = [
                            os.path.join(base_octave, vdir, 'mingw64', 'bin', 'octave-cli.exe'),
                            os.path.join(base_octave, vdir, 'bin', 'octave-cli.exe'),
                            os.path.join(base_octave, vdir, 'mingw32', 'bin', 'octave-cli.exe')
                        ]
                        if os.path.isfile(possible_paths[0]):
                            self.oct_exe_path = possible_paths[0]
                            break
                        elif os.path.isfile(possible_paths[1]):
                            self.oct_exe_path = possible_paths[1]
                            break
                        elif os.path.isfile(possible_paths[2]):
                            self.oct_exe_path = possible_paths[2]
                            break
                except:
                    pass
            if self.oct_exe_path is False:
                if shutil.which('octave-cli.exe'):
                    self.oct_exe_path = shutil.which('octave-cli.exe')
        else:
            self.oct_exe_path = shutil.which('octave-cli')
            if not shutil.which('octave-cli'):
                try:
                    if os.path.isfile('/usr/local/bin/octave-cli'):
                        self.oct_exe_path = '/usr/local/bin/octave-cli'
                    elif os.path.isdir('/Applications'):
                        for dname in os.listdir('/Applications'):
                            if fnmatch.fnmatch(dname, 'Octave-*'):
                                self.oct_exe_path = os.path.join('/Applications', dname, 'Contents/Resources/usr/bin/octave-cli')
                except:
                    pass
        if self.oct_exe_path is not False:
            # self.oct_exe_path = pathlib.Path(self.oct_exe_path).as_uri()
            return self.set_oct_exe_path()
        else:
            return {'octave_path': False }

    def set_oct_exe_path(self, path=None):
        ''' This method is run when
                * The shared.json file already has a path set >> path in argument
                * The octave path is set manually >> path in argument as well
        '''
        lg.info('-- SET OCT EXE PATH')
        # lg.warning('>> MANUAL PATH: {}'.format(path))

        if path is not None:
            if sys.platform == 'win32':
                if os.path.basename(path) != 'octave-cli.exe':
                    self.oct_exe_path = os.path.join(path, 'octave-cli.exe')
                else:
                    self.oct_exe_path = path
            else:
                if os.path.basename(path) != 'octave-cli':
                    self.oct_exe_path = os.path.join(path, 'octave-cli')
                else:
                    self.oct_exe_path = path

        if self.oct_exe_path is not False:
            os.environ['OCTAVE_EXECUTABLE'] = self.oct_exe_path
            try:
                oct2py_lib = importlib.import_module('oct2py')
                self.oc = oct2py_lib.octave
                self.oc.addpath(os.path.join(OCEAN_DATA_QC_PY, 'octave'))
                self.oc.addpath(os.path.join(OCEAN_DATA_QC_PY, 'octave', 'CANYON-B'))
                return {'octave_path': self.oct_exe_path }
            except Exception as e:
                lg.error('>> oct2py LIBRARY COULD NOT BE IMPORTED, OCTAVE PATH WAS NOT SET CORRECTLY')
        return {'octave_path': False }

    def pressure_combined(self, CTDPRS, DEPTH, LATITUDE):
        pressure = -1 * CTDPRS
        #pres_from_depth = sw.pres(DEPTH, LATITUDE)
        #pressure[np.isnan(pressure)] = pres_from_depth[np.isnan(pressure)]
        return pressure

    def depth_combined(self, CTDPRS, DEPTH, LATITUDE):
        #depth = DEPTH
        depth_from_pres = -1 * sw.dpth(CTDPRS, LATITUDE)
        #depth[np.isnan(depth)] = depth_from_pres[np.isnan(depth)]
        return depth_from_pres

    def nitrate_combined(self, NITRAT, NITRIT, NO2_NO3):
        return self.oc.nitrate_combined(np.transpose(np.vstack((NITRAT, NITRIT, NO2_NO3))))

    def salinity_combined(self):
        return self.column_combined(
            msg='Salinity combined in the column _SALINITY.',
            col1='CTDSAL', col2='SALNTY'
        )

    def oxygen_combined(self):
        return self.column_combined(
            msg='Oxygen combined in the column _OXYGEN.',
            col1='CTDOXY', col2='OXYGEN'
        )

    def column_combined(self, msg, col1, col2):
        ''' @msg - the beginning of the message that is shown in the actions history
            @col1 - the first column name to combine, more precise than the second
            @col1 - the second column name to combine
        '''
        msg = msg
        df = self.env.cruise_data.df
        COL1 = True
        if col1 not in df or (col1 in df and df[col1].isnull().all()):
            COL1 = False

        COL2 = True
        if col2 not in df or (col2 in df and df[col2].isnull().all()):
            COL2 = False

        if COL1 and not COL2:
            ret = df[col1].to_numpy()
            ret[(df[f'{col1}{FLAG_END}'] > 2) & (df[f'{col2}{FLAG_END}'] != 6)] = np.nan
            msg += f' {col1} was taken because {col2} is empty or does not exist'
        elif COL2 and not COL1:
            ret = df[col2].to_numpy()
            ret[(df[f'{col2}{FLAG_END}'] > 2) & (df[f'{col2}{FLAG_END}'] != 6)] = np.nan
            msg += f' {col2} was taken because {col1} is empty or does not exist'
        elif not COL2 and not COL1:
            ret = pd.Series([np.nan] * len(df.index))
            msg += f' {col1} and {col2} do not exist'
        else:
            col1_arr = df[col1].to_numpy()
            col1_arr[(df[f'{col1}{FLAG_END}'] > 2) & (df[f'{col1}{FLAG_END}'] != 6)] = np.nan
            col2_arr = df[col2].to_numpy()
            col2_arr[(df[f'{col2}{FLAG_END}'] > 2) & (df[f'{col2}{FLAG_END}'] != 6)] = np.nan

            dev = np.nanmean(np.abs(col1_arr - col2_arr))
            col2_nonnans = np.sum(~np.isnan(col2_arr)) / np.size(col2_arr)

            if col2_nonnans > 0.8:
                msg += f'Use {col2} as more {col2_nonnans * 100}% of data has it.'
                ret = col2_arr
            if dev < 0.003:
                msg += f' Gaps filled with {col1} as mean deviation is {dev:.4f}'
                ret = np.where(~np.isnan(col2_arr), col2_arr, col1_arr)
            else:
                mask = ~np.isnan(col2_arr) & ~np.isnan(col1_arr)
                slope, intercept, r_value, p_value, std_err = stats.linregress(col1_arr[mask], col2_arr[mask])
                rsq = r_value * r_value
                if rsq > 0.99:
                    msg = msg + f' Calibrating {col1} (R^2={rsq:.3f}) to filll gaps as mean deviation is {dev:.4f}'
                    calibrated_ctd = slope * col1_arr + intercept
                    ret = np.where(~np.isnan(col2_arr), col2_arr, calibrated_ctd)
                else:
                    msg += f' Not filling gaps with {col1} as mean deviation is {dev:.4f} and trying to calibrate gots a R^2={rsq:.3f}'
                    ret = col2_arr

        self.env.cruise_data.add_moves_element('column_combined', msg)
        lg.warning(f'>> {msg}')
        return ret

    def aou_gg(self, SAL, THETA, OXY):
        ret = self.oc.aou_gg(np.transpose(np.vstack((SAL, THETA, OXY))))
        return ret

    def tcarbn_from_alkali_phsws25p0(self, ALKALI, PH_SWS, SAL, SILCAT, PHSPHT):
        ret = self.oc.tcarbn_from_alkali_phsws25p0(np.transpose(np.vstack((ALKALI, PH_SWS, SAL, SILCAT, PHSPHT))))
        return ret

    def tcarbn_from_alkali_phts25p0(self, ALKALI, PH_TOT, SAL, SILCAT, PHSPHT):
        ret = self.oc.tcarbn_from_alkali_phts25p0(np.transpose(np.vstack((ALKALI, PH_TOT, SAL, SILCAT, PHSPHT))))
        return ret

    def phts25p0_from_alkali_tcarbn(self, ALKALI, TCARBN, SAL, SILCAT, PHSPHT):
        ret = self.oc.phts25p0_from_alkali_tcarbn(np.transpose(np.vstack((ALKALI, TCARBN, SAL, SILCAT, PHSPHT))))
        return ret

    def alkali_nng2_vel13(self, LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY):
        ret = np.transpose(self.oc.alkali_nng2_vel13(
            np.vstack((LONGITUDE, LATITUDE, -1 * DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY))))
        return ret

    def alkali_nngv2_bro19(self, LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY):
        ret = np.transpose(self.oc.alkali_nngv2_bro19(
            np.vstack((LATITUDE, np.cos(np.deg2rad(LONGITUDE)), np.sin(np.deg2rad(LONGITUDE)), -1 * DPTH, THETA, SAL, PHSPHT, NITRAT, SILCAT, OXY))))
        return ret

    def tcarbn_nngv2ldeo_bro20(self, LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY, YEAR):
        ret = np.transpose(self.oc.tcarbn_nngv2ldeo_bro20(
            np.vstack((LATITUDE, np.cos(np.deg2rad(LONGITUDE)), np.sin(np.deg2rad(LONGITUDE)), -1 * DPTH, THETA, SAL, PHSPHT, NITRAT, SILCAT, OXY, YEAR))))
        return ret

    def nitrat_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.nitrat_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

    def phspht_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.phspht_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

    def silcat_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.silcat_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

    def alkali_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.alkali_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

    def tcarbn_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.tcarbn_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

    def phts25p0_nncanyonb_bit18(self, DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
        return self.oc.phts25p0_nncanyonb_bit18(np.transpose(np.vstack((DATE.to_numpy() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))
