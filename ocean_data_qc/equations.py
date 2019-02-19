# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import os
import pandas as pd
import numpy as np
import seawater as sw
from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.octave.octave import OCTAVE_EXECUTABLE
from datetime import datetime

os.environ['OCTAVE_EXECUTABLE'] = OCTAVE_EXECUTABLE
from oct2py import Oct2Py
oc = Oct2Py()
oc.addpath(os.path.join(OCEAN_DATA_QC, 'octave'))
oc.addpath(os.path.join(OCEAN_DATA_QC, 'octave', 'CANYON-B'))

def pressure_combined(CTDPRS, DEPTH, LATITUDE):
    pressure = -1 * CTDPRS
    #pres_from_depth = sw.pres(DEPTH, LATITUDE)
    #pressure[np.isnan(pressure)] = pres_from_depth[np.isnan(pressure)]
    return pressure

def depth_combined(CTDPRS, DEPTH, LATITUDE):
    #depth = DEPTH
    depth_from_pres = -1 * sw.dpth(CTDPRS, LATITUDE)
    #depth[np.isnan(depth)] = depth_from_pres[np.isnan(depth)]
    return depth_from_pres   

def nitrate_combined(NITRAT, NITRIT, NO2_NO3):
    return oc.nitrate_combined(np.transpose(np.vstack((NITRAT, NITRIT, NO2_NO3))))

def salinity_combined(ctdsal, ctdsalf, botsal, botsalf):
    return oc.salinity_combined(np.transpose(np.vstack((ctdsal, ctdsalf, botsal, botsalf))))

def oxygen_combined(ctdoxy, ctdoxyf, botoxy, botoxyf):
    return oc.oxygen_combined(np.transpose(np.vstack((ctdoxy, ctdoxyf, botoxy, botoxyf))))

def aou_gg(SAL, THETA, OXY):
    ret = oc.aou_gg(np.transpose(np.vstack((SAL, THETA, OXY))))
    return ret

def tcarbon_from_alk_phsws25p0(ALKALI, PH_SWS, SAL, SILCAT, PHSPHT):
    ret = oc.tcarbon_from_alk_phsws25p0(np.transpose(np.vstack((ALKALI, PH_SWS, SAL, SILCAT, PHSPHT))))
    return ret

def tcarbon_from_alk_phts25p0(ALKALI, PH_TOT, SAL, SILCAT, PHSPHT):
    ret = oc.tcarbon_from_alk_phts25p0(np.transpose(np.vstack((ALKALI, PH_TOT, SAL, SILCAT, PHSPHT))))
    return ret

def phts25p0_from_alk_tcarbn(ALKALI, TCARBN, SAL, SILCAT, PHSPHT):
    ret = oc.phts25p0_from_alk_tcarbn(np.transpose(np.vstack((ALKALI, TCARBN, SAL, SILCAT, PHSPHT))))
    return ret

def alk_nng2_vel13(LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY):
    ret = np.transpose(oc.alk_nng2_vel13(
        np.vstack((LONGITUDE, LATITUDE, -1 * DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY))))
    return ret

def alk_nn_bro18(LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY):
    ret = np.transpose(oc.alk_nn_bro18(
        np.vstack((LATITUDE, np.cos(np.deg2rad(LONGITUDE)), np.sin(np.deg2rad(LONGITUDE)), -1 * DPTH, THETA, SAL, PHSPHT, NITRAT, SILCAT, OXY))))
    return ret

def alk_nnw3rmse_bro18(LONGITUDE, LATITUDE, DPTH, THETA, SAL, NITRAT, PHSPHT, SILCAT, OXY):
    ret = np.transpose(oc.alk_nnw3rmse_bro18(
        np.vstack((LATITUDE, np.cos(np.deg2rad(LONGITUDE)), np.sin(np.deg2rad(LONGITUDE)), -1 * DPTH, THETA, SAL, PHSPHT, NITRAT, SILCAT, OXY))))
    return ret

def nitrat_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.nitrat_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))
    
def phspht_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.phspht_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))
    
def silcat_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.silcat_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values()//10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

def alk_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.alk_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values()//10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

def dic_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.dic_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values()//10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))

def phts25p0_nncanyonb_bit18(DATE, LATITUDE, LONGITUDE, PRES, CTDTMP, SAL, OXY):
    return oc.phts25p0_nncanyonb_bit18(np.transpose(np.vstack((DATE.get_values() // 10000, LATITUDE, LONGITUDE, -1 * PRES, CTDTMP, SAL, OXY))))
