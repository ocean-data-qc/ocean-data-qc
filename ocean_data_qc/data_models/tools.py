# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

import numpy as np
from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.data_models.exceptions import ValidationError

''' Common basic functions used in the entire program '''

def merge(d1, d2):
    ''' Merges two dictionarys with lists as values
            d1 = {
                'x': [(0, nan), (1, nan), (2, nan), (3, nan), (4, nan), (5, nan)],
                'y': [(0, nan), (2, nan), (3, nan), (4, nan), (5, nan), (6, nan)]
            }
            d2 = {
                'y': [(0, 0.0), (1, 6.0), (2, 76.0), (4, 0.0), (5, 1.0)],
                'z': [(3, 4.0)]
            }
            merge(d1, d2)
            >> output: {
                'x': [(0, nan), (1, nan), (2, nan), (3, nan), (4, nan), (5, nan)],
                'y': [(0, 0.0), (1, 6.0), (2, 76.0), (4, 0.0), (5, 1.0), (6, nan)],
                'z': [(3, 4.0)]
            }
    '''
    for c in list(set(list(d1.keys()) + list(d2.keys()))):
        if c in d1 and c in d2:
            d_aux = dict(d1[c])
            d_aux.update(dict(d2[c]))
            t_list = list(zip(d_aux.keys(), list(d_aux.values())))
            t_list.sort(key=lambda t: t[0])
            d1[c] = t_list
        elif c in d2 and c not in d1:
            d1[c] = d2[c]
    return d1

def trans(d):
    ''' This function creates a minimal structure with slices and
        values to update the current CDS
    '''
    def build(last, cur, val):
        if cur == last + 1:
            if np.isnan(val):
                return (slice(last, cur), np.array([np.nan]))
            else:
                return (last, val)
        else:
            return (slice(last, cur), np.array([val] * (cur - last)))
    indices = list(d.keys())
    last = d[indices[0]]
    old = last_index = indices[0]
    resul = []
    for i in indices[1:]:
        if ((d[i] != last) and not(np.isnan(d[i]) and np.isnan(last))) \
            or i != old + 1:
            resul.append(build(last_index, old + 1, last))
            last_index = i
            last = d[i]
        old = i
    resul.append(build(last_index, old+1, last))
    return resul