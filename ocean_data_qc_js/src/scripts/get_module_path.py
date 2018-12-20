try:
    import ocean_data_qc
    print(ocean_data_qc.__path__.__dict__["_path"][0])
except ImportError:
    import os
    #os.chdir('../../..')
    import sys
    #sys.path.append(os.path.abspath('../../../'))
    # import ocean_data_qc
    print(os.path.abspath('../../../'))

# NOTE: This should work, in fact, it worked once:
# import importlib
# print(importlib.util.find_spec('ocean_data_qc').submodule_search_locations._path[0])