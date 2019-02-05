# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from ocean_data_qc.constants import *
from ocean_data_qc.octave.octave import OCTAVE_EXECUTABLE
from ocean_data_qc.data_models.exceptions import ValidationError
from ocean_data_qc.env import Environment

import json
from os import path, environ, getenv
import re
from math import *
import seawater as sw
import types
import subprocess as sbp

# NOTE: check octave availability againg here because if we check shared_data maybe
#       the value is not updated due to asyncronous matters
oc_output = sbp.getstatusoutput('%s --eval "OCTAVE_VERSION"'%(OCTAVE_EXECUTABLE))
if oc_output[0] == 0:
    lg.info('>> OCTAVE DETECTED FROM PYTHON, VERSION: {}'.format(
        oc_output[1].split('=')[1].strip())
    )
    import ocean_data_qc.equations as equations
else:
    lg.warning('>> OCTAVE UNDETECTED')
    equations = None


class ComputedParameter(Environment):
    env = Environment

    def __init__(self):
        lg.info('-- INIT COMPUTED PARAMETER')
        self.env.cp_param = self
        self.sandbox_vars = None
        self.sandbox_funcs = None
        self.set_computed_parameters()
        self.add_all_possible_cps()

    def get_cps_from_json(self):
        """ Get computed parameters from json files:
            result = {
                'custom': computed parameters (predefined by the user, or by default)
                'current': computed parameters in this project
            }
        """
        proj_settings = {}
        custom_settings = {}
        try:
            proj_settings = json.load(open(PROJ_SETTINGS))
            custom_settings = json.load(open(CUSTOM_SETTINGS))
        except Exception:
            lg.warning('JSON settings file could be opened in order to load .')
        result = {
            'custom_settings_cps': custom_settings['computed_params'] if 'computed_params' in custom_settings else {},
            'proj_settings_cps': proj_settings['computed_params'] if 'computed_params' in proj_settings else {},
        }
        return result

    def add_computed_parameter(self, arg):
        ''' It adds the computed parameter to cols and to the project
            Previously this method we had to check the dependencies and
            that all the columns needed are in the current dataframe
        '''
        lg.info('Assing computer parameter: {}'.format(arg['value']))
        val = arg.get('value', False)
        init = arg.get('init', False)
        if val is False:
            return {
                'success': False,
                'msg': 'value is mandatory',
            }

        cps = self.get_cps_from_json()
        proj_cps = cps['proj_settings_cps']
        for cp in proj_cps:  # NOTE: list of dicts, I need to iterate over all the items to get the cp to add
            if cp['param_name'] == val:
                new_cp = {
                    'eq': cp['equation'],
                    'computed_param_name': cp['param_name'],
                    'precision': int(cp['precision']),
                }
                result = self.compute_equation(new_cp)
                if result.get('success', False):
                    self.env.cruise_data.cols[val] = {
                        'types': ['computed'],
                        'unit': cp.get('units', False),
                    }
                    if init is False:
                        self.env.cruise_data.save_attributes()
                    lg.info('>> CP ADDED: {}'.format(val))
                else:
                    lg.warning('>> CP NO ADDED: {}'.format(val))
                return result

    def compute_equation(self, args):
        try:
            prec = int(args.get('precision', 5))
        except Exception:
            lg.error('Precision value could not be cast to integer value')
        (eq, computed_param_name, precision) = (
            args.get('eq', ''),
            args.get('computed_param_name', 'AUX'),
            prec
        )
        eq = re.sub(' ', '', eq)   # remove spaces

        if eq == '':
            lg.error('ERROR: Empty equation')

        cps = self.get_cps_from_json()
        proj_cps = cps['proj_settings_cps']
        # lg.info('>> COMPUTED PARAMS LIST: {}'.format(proj_cps))

        def repl(match):
            """ This function is run for each found ocurrence """
            inner_word = match.group(0)
            new_var = False
            param_name = inner_word[2:-1]   # removin characters: ${PARAM} >> PARAM
            for elem in proj_cps:
                if elem['param_name'] == param_name:
                    new_var = '({})'.format(elem.get('equation', False))

            if new_var is False:
                lg.error('The computed parameter does not exist')
            lg.info('>> INNER WORD: {} | NEW VAR: {}'.format(inner_word, new_var))
            return new_var

        while re.search(r'\$\{[a-zA-Z0-9_]+\}', eq) is not None:
            eq = re.sub(r'\$\{[a-zA-Z0-9_]+\}', repl, eq)

        if self.sandbox_funcs is None or self.sandbox_vars is None:
            self.sandbox_funcs = self._get_sandbox_funcs(locals())
            self.sandbox_vars = self._get_sandbox_vars(globals())
        ids = self._get_eq_ids(eq)

        # check if all the identifiers are in the df
        for i in ids:
            if i not in self.env.cruise_data.df.columns:  # already calculated parameters also can be use as columns
                return {
                    'success': False,
                    'msg': 'Some identifiers do not exist in the current dataframe',
                }

        eq = '{} = {}'.format(computed_param_name, eq)
        lg.info('>> EQUATION: {}'.format(eq))
        try:
            self.env.cruise_data.df.eval(
                expr=eq,
                engine='python',                 # NOTE: numexpr does not support custom functions
                inplace=True,
                local_dict=self.sandbox_funcs,
                global_dict=self.sandbox_vars
            )
        except Exception as e:
            lg.warning('The equation could not be computed: {}'.format(e))
            return {
                'success': False,
                'msg': 'The equation could not be computed: {}'.format(eq),
                'error': '{}'.format(e),
            }
        if computed_param_name == 'AUX' and 'AUX' in self.env.cruise_data.df.columns:
            del self.env.cruise_data.df['AUX']
        else:
            self.env.cruise_data.df = self.env.cruise_data.df.round({computed_param_name: precision})

        return {
            'success': True,
        }

    def _get_eq_ids(self, eq):
        ''' Return a list of identifiers used by the equation
            The parameters ${} should already be replaced before
            Pure numbers are deleted from the list
        '''
        func_list = []
        for key, value in self.sandbox_funcs.items():
            if value != None:
                func_list.append(key)

        var_list = []
        for key, value in self.sandbox_vars.items():
            if value != None:
                var_list.append(key)

        ids = re.findall('[a-zA-Z0-9_]+', eq)
        ids = [x for x in ids if (x not in func_list) and (x not in var_list)]

        # remove numbers from the list
        ids = [x for x in ids if re.match(r'[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?', x) is None]
        return ids

    def _get_sandbox_funcs(self, loc_dict={}):
        local_dict = loc_dict.copy()        # deepcopy() > recursively  ???

        for elem in local_dict:             # resets all the values
            local_dict[elem] = None

        # math functions
        local_dict.update({
            'acos': acos, 'asin': asin, 'atan': atan, 'atan2': atan2,
            'ceil': ceil, 'cos': cos, 'cosh': cosh, 'degrees': degrees,
            'exp': exp, 'fabs': fabs, 'floor': floor, 'fmod': fmod,
            'frexp': frexp, 'hypot': hypot, 'ldexp': ldexp, 'log': log,
            'log10': log10, 'modf': modf, 'pow': pow, 'radians': radians,
            'sin': sin, 'sinh': sinh, 'sqrt': sqrt, 'tan': tan, 'tanh': tanh,
        })

        # seawater functions
        local_dict.update({
            'cndr': sw.library.cndr, 'salds': sw.library.salrp, 'salrt': sw.library.salrt, 'seck': sw.library.seck,
            'sals': sw.library.sals, 'smow': sw.library.smow, 'T68conv': sw.library.T68conv, 'T90conv': sw.library.T90conv,

            'adtg': sw.eos80.adtg, 'alpha': sw.eos80.alpha, 'aonb': sw.eos80.aonb,
            'beta': sw.eos80.beta, 'dpth': sw.eos80.dpth, 'g': sw.eos80.g, 'salt': sw.eos80.salt, 'fp': sw.eos80.fp,
            'svel': sw.eos80.svel, 'pres': sw.eos80.pres, 'dens0': sw.eos80.dens0, 'dens': sw.eos80.dens,
            'pden': sw.eos80.pden, 'cp': sw.eos80.cp, 'ptmp': sw.eos80.ptmp, 'temp': sw.eos80.temp,

            'bfrq': sw.geostrophic.bfrq, 'svan': sw.geostrophic.svan, 'gpan': sw.geostrophic.gpan, 'gvel': sw.geostrophic.gvel,

            'dist': sw.extras.dist, 'f': sw.extras.f, 'satAr': sw.extras.satAr,
            'satN2': sw.extras.satN2, 'satO2': sw.extras.satO2, 'swvel': sw.extras.swvel,
        })
        if equations is not None:
            for elem_str in dir(equations):
                elem_obj = getattr(equations, elem_str)
                if isinstance(elem_obj, (\
                   types.FunctionType, types.BuiltinFunctionType,
                   types.MethodType, types.BuiltinMethodType)):
                    local_dict.update({elem_str: elem_obj})
        return local_dict

    def _get_sandbox_vars(self, glob_dict={}):
        global_dict = glob_dict.copy()

        for elem in global_dict:
            global_dict[elem] = None

        return global_dict

    def check_dependencies(self):
        ''' If the CP can be computed then the dependencies are satisfied
            Maybe it is a good idea to avoid the eval method for efficiency?

            This is used when the form 'add_computed_parameter_expression' is loaded

            @return = {
                'cp_param_1': True,                 # dependencies satisfied
                'cp_param_2': False,                 # dependencies don't satisfied
            }
        '''
        proj_settings = json.load(open(PROJ_SETTINGS))
        computed_params = proj_settings.get('computed_params', False)
        if computed_params is not False:
            result = {}
            for cp in computed_params:
                args = {
                    'eq': cp.get('equation', False),
                }
                ce_result = self.compute_equation(args)
                if ce_result.get('success', False) is True:
                    result.update({
                        cp.get('param_name'): True
                    })
                else:
                    result.update({
                        cp.get('param_name'): False
                    })
            return result
        else:
            return {}

    def get_all_parameters(self):
        lg.info('-- GET ALL PARAMETERS')
        cols = self.env.cruise_data.get_columns_by_type(
            ['param', 'param_flag', 'qc_param_flag', 'non_qc_param', 'required']
        )
        deps = self.check_dependencies()
        cp_cols = self.env.cruise_data.get_columns_by_type(['computed'])
        return dict(
            columns=cols,
            dependencies=deps,
            computed=cp_cols
        )

    def delete_computed_parameter(self, args):
        ''' Delete the value passed in the argument:
            args = {
                'value': 'example_column',
            }
        '''
        lg.info('-- DELETE COMPUTED PARAMETER')
        value = args.get('value', False)
        current_columns = self.env.cruise_data.get_columns_by_type(['all'])
        if value in current_columns:
            try:
                if value in self.env.cruise_data.df.columns:
                    del self.env.cruise_data.df[value]
                del self.env.cruise_data.cols[value]
                return {
                    'success': True,
                }
            except Exception:
                return {
                    'success': False,
                }
        else:
            return {
                'success': False,
            }

    def set_computed_parameters(self):
        lg.info('-- SET COMPUTED PARAMETERS')
        cps_list = self.env.cruise_data.get_columns_by_type(['computed'])  # active cps in the attributes.json file
        proj_settings = json.load(open(PROJ_SETTINGS))
        cp_settings = proj_settings['computed_params']
        for cp in cps_list:
            for c in cp_settings:
                if c['param_name'] == cp:
                    cp_to_compute = {
                        "computed_param_name": c['param_name'],
                        "eq": c['equation'],
                        "precision": c['precision'],
                    }
                    lg.info('>> PARAM TO COMPUTE: {}'.format(cp_to_compute))
                    self.compute_equation(cp_to_compute)

    def add_all_possible_cps(self):
        lg.info('-- ADD ALL POSSIBLE COMPUTED PARAMS')
        # NOTE: When the file is open the cps are copied from `custom_settings.json`
        #       So we have all the CP we need in cps['proj_settings_cps']
        cps = self.get_cps_from_json()
        proj_cps = cps['proj_settings_cps']
        for cp in proj_cps:
            self.add_computed_parameter({
                'value': cp['param_name'],
                'init': True  # to avoid save_attributes all the times, once is enough
            })
        self.env.cruise_data.save_attributes()
