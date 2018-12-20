# AtlantOS Ocean Data QC

Tool for 1st Quality Control on Hydrographic Cruise Data. The CSV files must have the [WHP format](https://www.nodc.noaa.gov/woce/woce_v3/wocedata_1/whp/exchange/exchange_format_desc.htm). This is a crossplatform application.

![](https://github.com/ocean-data-qc/ocean-data-qc/blob/master/ocean_data_qc_js/src/img/demo.gif?raw=true)

## Manual Installation

1. Download and install base dependencies:
    1. Download and install [Python](https://www.python.org/download/releases/3.0/) 3.x. Recommended downloader and instructions: https://conda.io/miniconda.html
    2. Download and install npm. Follow instructions from: https://nodejs.org
    3. Optional but very recommended for functionality: Octave
        - Download and install octave. Follow instructions from: https://www.gnu.org/software/octave/#install

1. Download this project
3. Install the python `ocean_data_qc` package and its dependencies in your python setup (if you have installed python through miniconda/anaconda and is not in PATH, you have to use Anaconda Prompt as command shell):

        python setup.py develop

3. Install the node dependencies in the `ocean_data_qc_js` folder

        cd ocean_data_qc_js
        npm install             # or yarn install

4. Open the GUI from the `ocean_data_qc_js` folder 

        cd ocean_data_qc_js
        npm start               # or yarn start
        (first time launching delays some time, please wait)

## Windows Releases

There will be releases with Windows installers so far. The app can be autoupdated with the new releases. If the autoupdate does not work, go to releases tab on the GitHub website, download and install the latest version.

## Technologies Used

* [**Electron**](https://electronjs.org/) (formerly known as Atom Shell) is an open-source framework developed and maintained by GitHub. Electron allows for the development of desktop GUI applications using front and back end components originally developed for web applications: Node.js runtime for the backend and Chromium for the frontend.
* [**Bokeh**](https://bokeh.pydata.org) (Python Library). Bokeh is an interactive visualization library that targets modern web browsers for presentation. Its goal is to provide elegant, concise construction of versatile graphics, and to extend this capability with high-performance interactivity over very large or streaming datasets.
* [**Octave**](https://www.gnu.org/software/octave/). AtlantOS Ocean Data QC uses some functions created within Octave in order to create calculated columns. If you want to make them work, you must install Octave and make the `octave` command available on your `PATH` environment variable. This is an optional feature.

## License

This project is licensed under the GPLv3 License - see the LICENSE file for details

## Authors

* @CSIC: Jesús Cacabelos <jcacabelos@iim.csic.es>
* @CSIC: Antón Velo <avelo@iim.csic.es>
* @CSIC: Fiz F. Pérez <fiz.perez@iim.csic.es>
* @GEOMAR: Toste Tanhua <ttanhua@geomar.de>
* @GEOMAR: Nico Lange <nlange@geomar.de>

## References

* [CO2SYS.m](https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1). CO2SYS version 1.1 (Sept 2011)
    >van Heuven, S., D. Pierrot, J.W.B. Rae, E. Lewis, and D.W.R. Wallace (2011) MATLAB Program Developed for CO2 System Calculations. ORNL/CDIAC-105b. Carbon Dioxide Information Analysis Center, Oak Ridge National Laboratory, U.S. Department of Energy, Oak Ridge, Tennessee. https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1

* [CANYON-B](https://github.com/HCBScienceProducts/CANYON-B). Adapted to run in this application
    >Bittig et al. (2018). An alternative to static climatologies: Robust estimation of open ocean CO2 variables and nutrient concentrations from T, S and O2 data using Bayesian neural networks. Front. Mar. Sci. 5:328. http://dx.doi.org/10.3389/fmars.2018.00328.

* Broullón, D., Pérez, F. F., Velo, A., Hoppema, M., Olsen, A., Takahashi, T., Key, R. M., González-Dávila, M., Tanhua, T., Jeansson, E., Kozyr, A., and van Heuven, S. M. A. C.: [A global monthly climatology of total alkalinity: a neural network approach](https://doi.org/10.5194/essd-2018-111), Earth Syst. Sci. Data Discuss., https://doi.org/10.5194/essd-2018-111, in review, 2018.

* Velo, A., Pérez, F.F., Tanhua, T., Gilcoto, M., Ríos, A.F., Key, R.M., 2013. [Total alkalinity estimation using MLR and neural network techniques](https://doi.org/10.1016/j.jmarsys.2012.09.002). Journal of Marine Systems 111–112, 0, 11–18. https://doi.org/10.1016/j.jmarsys.2012.09.002

* Fernandes, . (2014, August 25). python-seawater v3.3.2 (Version v3.3.2). Zenodo. http://doi.org/10.5281/zenodo.11395     