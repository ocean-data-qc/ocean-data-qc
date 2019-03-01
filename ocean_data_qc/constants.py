# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.palettes import Blues8, Reds3
from os import path, getenv
from bokeh.util.logconfig import bokeh_logger as lg


# ----------------- NUMERIC LITERALS ---------------------- #

NPROF = 2 # 6       # Number of profiles
                # NOTE: the maximum is 6 because if there are more there will be lag at loading time
                # TODO: move this to env in order to make it updatable

# ----------------- STRING LITERALS ----------------------- #

OUTPUT_BACKEND = 'webgl'    # Even if I change this to 'canvas',
                            # 'webgl' is activated for some other reason automatically
STNNBR = 'STNNBR'           # Stations column
FLAG_END = '_FLAG_W'        # Flag distinctive

NA_REGEX_LIST = [r'^-999[9]?[\.0]*?$']

REQUIRED_COLUMNS = [
    'EXPOCODE', 'STNNBR', 'CASTNO', 'DATE', 'LATITUDE', 'LONGITUDE'
]

NON_QC_PARAMS = [                                # discovered by usage
    'CTDPRS', 'DEPTH',
    'SECT', 'SECT_ID', 'TIME', 'PH_TMP'
]

BASIC_PARAMS = [
    'CTDSAL', 'SALNTY', 'CTDOXY', 'OXYGEN',
    'NITRAT', 'PHSPHT', 'NITRIT', 'NO2_NO3',
    'CTDPRS', 'DEPTH',
    'CTDTMP'
]

# --------------------- COLORS ---------------------------- #

BLUES = Blues8[1:-1]  # len = 6, from dark to light blue
RED = Reds3[0]
# LIGHT_RED = Reds3[1]

CIRCLE_COLORS = {
    0: '#d8f2d8',         # very very light green
    1: '#beeabe',         # very light green
    2: '#99cc99',         # light green
    3: '#e5ad45',         # light orange
    4: '#b5472c',         # red
    5: '#ffa500',         # orange
    6: '#198c19',         # green
    7: '#b86cee',         # violet
    8: '#8111d0',         # dark violet
    9: '#ad0ac1',         # pink
}

# ----------------------- LOCATIONS ---------------------------------- #

OCEAN_DATA_QC = path.realpath(
    path.dirname(
        path.abspath(__file__)
    ),
)
APPDATA = getenv('APPDATA')
if not APPDATA:
    if path.isdir(path.join(getenv('HOME'), 'Library', 'Application Support')):
        APPDATA = path.join(getenv('HOME'), 'Library', 'Application Support')
    elif path.isdir(path.join(getenv('HOME'), '.config')):
        APPDATA = path.join(getenv('HOME'), '.config')
    else:
        APPDATA = OCEAN_DATA_QC

FILES = path.join(APPDATA, 'ocean-data-qc', 'files')
TMP = path.join(APPDATA, 'ocean-data-qc', 'files', 'tmp')
UPD = path.join(APPDATA, 'ocean-data-qc', 'files', 'tmp', 'update')

PROJ_SETTINGS = path.join(TMP, 'settings.json')
CUSTOM_SETTINGS = path.join(FILES, 'custom_settings.json')
DEFAULT_SETTINGS = path.join(FILES, 'default_settings.json')

SHARED_DATA = path.join(FILES, 'shared_data.json')

MOVES_CSV = path.join(TMP, 'moves.csv')

APP_SHORT_NAME = 'OCEANDATAQC'
APP_LONG_NAME = 'AtlantOS Ocean Data QC'
