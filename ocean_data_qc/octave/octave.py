# -*- coding: utf-8 -*-
################################################################
#    License, author and contributors information in:          #
#    LICENSE file at the root folder of this application.      #
################################################################

import shutil
import sys
import os

OCTAVE_EXECUTABLE = shutil.which('octave')
if sys.platform == 'win32':
    if not shutil.which('octave.exe') and not shutil.which('octave-cli.exe'):
        base_octave = r'C:\Octave'
        if os.path.isdir(base_octave):
            try:
                vdir = os.listdir(base_octave)[0]
                if os.path.isfile(os.path.join(base_octave,vdir,'bin','octave-cli.exe')):
                    OCTAVE_EXECUTABLE = os.path.join(base_octave,vdir,'bin','octave-cli.exe')
            except:
                pass