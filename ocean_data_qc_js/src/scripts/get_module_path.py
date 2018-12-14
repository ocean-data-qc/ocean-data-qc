import ocean_data_qc
print(ocean_data_qc.__path__.__dict__["_path"][0])

# NOTE: This should work, in fact, it worked once:
# import importlib
# print(importlib.util.find_spec('ocean_data_qc').submodule_search_locations._path[0])