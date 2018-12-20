import ocean_data_qc
import pathlib

absolute_path_string = ocean_data_qc.__path__.__dict__["_path"][0]
print(pathlib.Path(absolute_path_string).as_uri())

# NOTE: This should work, in fact, it worked once:
# import importlib
# print(importlib.util.find_spec('ocean_data_qc').submodule_search_locations._path[0])