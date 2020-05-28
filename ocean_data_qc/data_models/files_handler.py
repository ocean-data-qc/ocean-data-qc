# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.env import Environment

from configparser import ConfigParser
from collections import OrderedDict
from more_itertools import unique_everseen
from os import path
import os
import json
import shutil
from hashlib import md5
from jinja2 import Template


class Graph():
    # TODO: remove this class, make a dictionary for example

    def __init__(self, i, tab, graph):
        self.pos = i
        self.tab = tab
        self.title = graph.get('title', '')
        self.x, self.x_rev = self._get_rev(graph.get('x', ''))
        self.y, self.y_rev = self._get_rev(graph.get('y', ''))

    def _get_rev(self, v):
        v_rev = False
        if v.startswith('-'):
            v_rev = True
            v = v[1:]
        v = self._sanitize(v)
        return v, v_rev

    def _sanitize(self, names):
        trdic = str.maketrans('-+', '__')
        if isinstance(names, (str, bytes)):
            return names.translate(trdic)
        else:
            sanitized_names = []
            for p in names:
                sanitized_names.append(p.translate(trdic))
            return sanitized_names


class FilesHandler(Environment):
    ''' Mainly this manages all the JSON files.
        TODO: Move all the asyncronous tasks on Electron with files to this file if possible
        TODO: the config file could be here as well
    '''
    env = Environment

    def __init__(self):
        self.env.f_handler = self

    def load_data(self):
        lg.info('-- LOAD DATA (FilesHandler class)')
        self._load_qc_plot_tabs()
        self._load_settings()

    def get_cols_in_tab(self, tab):
        cols = []
        for p in self.env.qc_plot_tabs[tab]:
            cols.append(p['x'])
            cols.append(p['y'])
        cols = list(set(cols))
        return cols

    def _load_qc_plot_tabs(self):
        ''' Load tabs from setting.json file. A structure like this:

                "qc_plot_tabs": {
                    "NITRAT": [
                        {
                            "title": "Nitrate vs Phosphate",
                            "x": "NITRAT",
                            "y": "PHSPHT"
                        },
                        {
                            "title": "Nitrate vs OXYGEN",
                            "x": "NITRAT",
                            "y": "OXYGEN"
                        }
                    ],
                    "PH_TOT": [
                        {
                            "title": "pH vs Nitrate",
                            "x": "PH_TOT",
                            "y": "NITRAT"
                        }
                    ]
                },
        '''
        self.graphs = []
        if path.isfile(path.join(TMP, 'settings.json')):
            with open(path.join(TMP, 'settings.json'), 'r') as f:
                config = json.load(f,  object_pairs_hook=OrderedDict)
            if 'qc_plot_tabs' in config:
                self.env.qc_plot_tabs = config.get('qc_plot_tabs', False)
                cols = []
                i = 0
                for tab in self.env.qc_plot_tabs:
                    for graph in self.env.qc_plot_tabs[tab]:
                        ge = Graph(i, tab, graph)
                        cols.append(graph.get('x', ''))
                        cols.append(graph.get('y', ''))
                        self.graphs.append(ge)
                        i += 1
                lg.info('>> N_PLOTS: {}'.format(i))
                self.env.n_plots = i
                cols = list(set(cols))
                if '' in cols:
                    cols.remove('')
                self.env.cur_plotted_cols = cols
        # lg.warning('>> SELF GRAPHS: {}'.format(self.graphs))

    def remove_cols_from_qc_plot_tabs(self, cols=[]):
        ''' Checks if the columns that are in the plot layout
            and removes them if needed
        '''
        lg.info('-- REMOVE COLS FROM QC PLOT TABS. REMOVING: {}'.format(cols))
        if cols != [] and path.isfile(path.join(TMP, 'settings.json')):
            config = {}
            tabs = {}
            with open(path.join(TMP, 'settings.json'), 'r') as f:
                config = json.load(f,  object_pairs_hook=OrderedDict)
                if 'qc_plot_tabs' in config:
                    tabs = config.get('qc_plot_tabs', False)
                    tabs_to_rmv = []
                    for tab in tabs:
                        graphs_to_rmv = []
                        for graph in tabs[tab]:
                            if graph.get('x', '') in cols or graph.get('y', '') in cols:
                                graphs_to_rmv.append(graph)
                        for g in graphs_to_rmv:
                            tabs[tab].remove(g)
                        if tabs[tab] == []:  # if all the plot of some tab were removed
                            tabs_to_rmv.append(tab)
                    for t in tabs_to_rmv:
                        del tabs[t]   # >> take into account that here config is also updated
            with open(path.join(TMP, 'settings.json'), 'w') as f:
                json.dump(config, f, indent=4, sort_keys=True)

    @property
    def graphs_per_tab(self):
        res = {}
        for g in self.graphs:
            if g.tab not in res:
                res[g.tab] = []
            res[g.tab].append(g)
        return res

    @property
    def tab_list(self):
        ret = []
        for g in self.graphs:
            ret.append(g.tab)
        ret = unique_everseen(ret)
        return list(ret)

    def get_layout_settings(self):
        lg.info('-- GET LAYOUT SETTINGS')
        ly_settings = {}
        if path.isfile(path.join(TMP, 'settings.json')):
            with open(path.join(TMP, 'settings.json'), 'r') as f:
                config = json.load(f)
                if 'layout' in config:
                    ly = config.get('layout', False)
                    ly_settings['ncols'] = ly.get('plots_per_row', 3)
                    ly_settings['plot_width'] = ly.get('plots_width', 400)
                    ly_settings['plot_height'] = ly.get('plots_height', 400)
        return ly_settings if ly_settings != {} else False

    def _load_settings(self):
        ''' Load some settings into object attributes '''
        if path.isfile(path.join(TMP, 'settings.json')):
            with open(path.join(TMP, 'settings.json'), 'r') as f:
                config = json.load(f)
                if 'layout' in config:
                    ly = config.get('layout', False)
                    if ly is not False:
                        self.env.show_titles = ly.get('titles')

    def remove_tmp_folder(self):
        lg.warning('-- REMOVE TMP FOLDER')
        shutil.rmtree(TMP)

    def get(self, attr, f_path):
        """ Gets data from json files
            * attr: attribute to get
            * f_path: file path where the file is located

            NOTE: This method should be avoided because access to hard disk is very costly
        """
        # lg.info('-- GET ATTR: {} | FROM FILE: {}'.format(attr, f_path))
        with open(f_path, 'r') as f:
            json_content = json.load(f)
        if attr in json_content:
            return json_content[attr]
        else:
            lg.warning(f'>> The attribute {attr} is not in the JSON file: {f_path}')

    def set(self, attr, value, f_path):
        ''' Store attribute data to some json file
            * attr: attribute to set
            * value: new value to set
            * f_path: file path where the file is located
        '''
        with open(f_path, 'r') as f:
            json_content = json.load(f)
        if attr in json_content:
            json_content[attr] = value
            with open(f_path, 'w') as fp:
                json.dump(json_content, fp, indent=4, sort_keys=True)
        else:
            lg.warning(f'>> The attribute {attr} is not in the JSON file: {f_path}')

    def get_custom_cols_by_attr(self, attr):
        ''' return a list of fields selected by attr from the custom_settings.json:
              * basic_params
              * required_columns
              * non_qc_param

              TODO: this is called many times, try to access to disk less by storing the
                    content of columns somewhere (it just has to be updated when the user modify it)
        '''
        cols = self.get('columns', CUSTOM_SETTINGS)
        l = []
        for c in cols:
            if attr in cols[c]['types']:
                l.append(c)
        l = sorted(l)
        return l

class BokehTemplate(Template):
    def render(self, *args, **kwargs):
        ''' Adds a hash to the end of the url resources if `with_hash`
            function is used in the template
        '''
        def with_hash(rel_path):
            f_path = path.join(OCEAN_DATA_QC, rel_path)
            with open(f_path, 'rb') as f:
                return f'{rel_path}?v={md5(f.read()).hexdigest()}'

        if 'with_hash' not in kwargs:
            kwargs['with_hash'] = with_hash
        return super().render(*args, **kwargs)