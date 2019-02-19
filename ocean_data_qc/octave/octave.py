# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import shutil
import sys
import fnmatch
import os
from bokeh.util.logconfig import bokeh_logger as lg

OCTAVE_EXECUTABLE = shutil.which('octave')
if sys.platform == 'win32':
    if not shutil.which('octave.exe') and not shutil.which('octave-cli.exe'):
        base_octave = r'C:\Octave'
        if os.path.isdir(base_octave):
            try:
                vdir = os.listdir(base_octave)[0]
                if os.path.isfile(os.path.join(base_octave, vdir,'bin','octave-cli.exe')):
                    OCTAVE_EXECUTABLE = os.path.join(base_octave, vdir,'bin','octave-cli.exe')
            except:
                pass
else:
    if not shutil.which('octave'):
        if os.path.isfile('/usr/local/bin/octave'):
            OCTAVE_EXECUTABLE = '/usr/local/bin/octave'
        else:
            for dname in os.listdir('/Applications'):
                if fnmatch.fnmatch(dname, 'Octave-*'):
                    OCTAVE_EXECUTABLE = os.path.join('/Applications', dname, 'Contents/Resources/usr/bin/octave')
lg.info('-- OCTAVE_EXECUTABLE: {}'.format(OCTAVE_EXECUTABLE))
