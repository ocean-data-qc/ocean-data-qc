import shutil
import sys
import fnmatch
import os
import pathlib

OCTAVE_EXECUTABLE = ''
if sys.platform == 'win32':
    base_octave = r'C:\Octave'
    if os.path.isdir(base_octave):
        try:
            odir = sorted(os.listdir(base_octave), reverse=True)
            for vdir in odir:
                if os.path.isfile(os.path.join(base_octave, vdir, 'mingw64', 'bin', 'octave-cli.exe')):
                    OCTAVE_EXECUTABLE = os.path.join(base_octave, vdir, 'mingw64', 'bin', 'octave-cli.exe')
                    break
                elif os.path.isfile(os.path.join(base_octave, vdir, 'bin', 'octave-cli.exe')):
                    OCTAVE_EXECUTABLE = os.path.join(base_octave, vdir, 'bin', 'octave-cli.exe')
                    break
                elif os.path.isfile(os.path.join(base_octave, vdir, 'mingw32', 'bin', 'octave-cli.exe')):
                    OCTAVE_EXECUTABLE = os.path.join(base_octave, vdir, 'mingw32', 'bin', 'octave-cli.exe')
                    break
        except:
            pass
    if OCTAVE_EXECUTABLE=='':
        if shutil.which('octave-cli.exe'):
            OCTAVE_EXECUTABLE = shutil.which('octave-cli.exe')
else:
    OCTAVE_EXECUTABLE = shutil.which('octave-cli')
    if not shutil.which('octave-cli'):
        try:
            if os.path.isfile('/usr/local/bin/octave-cli'):
                OCTAVE_EXECUTABLE = '/usr/local/bin/octave-cli'
            elif os.path.isdir('/Applications'):
                for dname in os.listdir('/Applications'):
                    if fnmatch.fnmatch(dname, 'Octave-*'):
                        OCTAVE_EXECUTABLE = os.path.join('/Applications', dname, 'Contents/Resources/usr/bin/octave-cli')
        except:
            pass

print(pathlib.Path(OCTAVE_EXECUTABLE).as_uri())
