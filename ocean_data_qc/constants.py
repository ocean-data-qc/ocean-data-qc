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
CTDPRS = 'CTDPRS'           # Pressure
FLAG_END = '_FLAG_W'        # Flag distinctive

NA_REGEX_LIST = [r'^-999[9]?[\.0]*?$']

REQUIRED_COLUMNS = [
    'EXPOCODE', 'STNNBR', 'CASTNO', 'DATE',
    'LATITUDE', 'LONGITUDE', 'BTLNBR'
]

NON_QC_PARAMS = [                                # discovered by usage
    'CTDPRS', 'DEPTH',
    'SECT', 'SECT_ID', 'TIME', 'PH_TMP',
    'DAY', 'MONTH', 'YEAR', 'HOUR', 'MINUTE',
] + REQUIRED_COLUMNS                            # TODO: Sometimes there is a BTLNBR_FLAG_W ???

BASIC_PARAMS = [                                # they are created if they do not exist yet
    'CTDSAL', 'SALNTY', 'CTDOXY', 'OXYGEN',
    'NITRAT', 'PHSPHT', 'NITRIT', 'NO2_NO3',
    'CTDPRS', 'DEPTH', 'CTDTMP', 'SAMPNO'
]

COL_NAMES_MAPPING = [
    ('EXPOCODE', 'CRUISE'),
    ('EXPOCODE', 'CRUISENO'),
    ('STNNBR', 'STATION'),
    ('CASTNO', 'CAST'),
    ('BTLNBR', 'BOTTLE'),
    ('CTDPRS', 'PRESSURE'),
    ('CTDTMP', 'TEMPERATURE'),
    ('SALNTY', 'SALINITY'),
    ('SALNTY', 'CTDSAL'),
    ('NITRAT', 'NITRATE'),
    ('NITRIT', 'NITRITE'),
    ('PHSPHT', 'PHOSPHATE'),
    ('SILCAT', 'SILICATE'),
    ('TCARBN', 'TCO2'),
    ('TCARBN', 'DIC'),
    ('TCARBN', 'CT'),
    ('ALKALI', 'TALK'),
    ('ALKALI', 'ALK'),
    ('PH_TOT', 'PHTS'),
    ('PH_TOT', 'PHTS25'),
    ('PH_TOT', 'PHTS25P0'),
    ('PH_TOT', 'PH_TOT25P0'),
    ('PH_SWS', 'PHSWS'),
    ('PH_SWS', 'PHSWS25'),
    ('PH_SWS', 'PHSWS25P0'),
    ('PH_SWS', 'PH_SWS25P0'),
    ('NO2_NO3', 'NO2NO3'),
    ('CFC_11', 'CFC11'),
    ('CFC_12', 'CFC12'),
]

# ---------------------- URLS ----------------------------- #

ARGIS_TS = "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{Z}/{Y}/{X}/"
LOCAL_TS = "http://127.0.0.1:8080/tiles/0/tiles/{Z}/{X}/{Y}/"

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

# TODO: this will only work with asar = false,
#       so checksums can be made all the process in js
OCEAN_DATA_QC_JS = path.join(OCEAN_DATA_QC, '..', 'ocean_data_qc_js')

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
