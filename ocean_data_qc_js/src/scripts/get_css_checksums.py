# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from ocean_data_qc.constants import *

import os
import hashlib
import sys

''' Creates sha1 hases to append at the end of the css and js urls
    The idea is to reload them only when there are changes and prevent
    from reloading from cache
    https://stackoverflow.com/a/15562751/4891717
'''

file_paths = []
filters = ('.css', '.js')
cache_paths = {
    'electron_css_path': os.path.join(OCEAN_DATA_QC_JS, 'src', 'css'),
    # 'electron_js_path': os.path.join(OCEAN_DATA_QC_JS, 'src', 'js'),
}
hashes = {}
for p in cache_paths.keys():
    hashes[p] = {}
    for pth, dirs, files in os.walk(cache_paths[p]):
        for f in files:
            if f.endswith(filters):
                file_paths.append(os.path.join(pth, f))
                # lg.warning('>> FILE TO SHA1: {}'.format(os.path.join(pth, f)))
    BUF_SIZE = 65536  # read stuff in 64kb chunks!
    sha1 = hashlib.sha1()
    for fpath in file_paths:
        with open(fpath, 'rb') as f:
            while True:
                data = f.read(BUF_SIZE)
                if not data:
                    break
                sha1.update(data)
            hashes[p][path.basename(fpath)] = sha1.hexdigest()  # TODO: if two files have the same name
                                                                #       only the latter will be the correct assigned
            sha1 = hashlib.sha1()  # reset buffer
print(hashes)