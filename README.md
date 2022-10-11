# AtlantOS QC (GLODAP QC1 tool) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.2603121.svg)](https://doi.org/10.5281/zenodo.2603121)

This software is an interactive tool for making the first Quality Control (1st QC, QC1) on Hydrographic Cruise Data. Built mainly in Python but using Node, JavaScript, HTML5 and related technologies. Can be run on multiple platforms.

![demo](https://github.com/ocean-data-qc/ocean-data-qc/blob/master/ocean_data_qc_js/src/img/demo.gif?raw=true)

## About

The development of this tool was initially funded by [**H2020-AtlantOS**](https://www.atlantos-h2020.eu/) project for _Optimising and Enhancing the Integrated
Atlantic Ocean Observing Systems_, being this funded by the European Union's Horizon 2020 research and innovation programme under grant agreement No 633211.

Version 1.0 was released under [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.2603122.svg)](https://doi.org/10.5281/zenodo.2603122) as Deliverable _**D2.6 GO-SHIP Software and Manuals**: Software packages and best practice manuals and knowledge transfer for sustained quality control of hydrographic sections in the Atlantic_ of [**H2020-AtlantOS**](https://www.atlantos-h2020.eu/) [Work package 2.1](https://www.atlantos-h2020.eu/project-information/work-packages/wp2/task-2-1/), being a Global Ocean Ship-Based Hydrographic Investigations Programme ([GO-SHIP](https://www.go-ship.org/)) task for support the quality assurance of on-going surveys and perform Quality Control (QC) procedures

Since version 1.0 to 1.4.0, the application had no specific nor continuous funding for its development, having received partial support from [H2020-COMFORT](https://comfort.w.uib.no/) project and being also a contribution to WATER:iOS Interdisciplinary Thematic Platform [@WATER_IOS_CSIC](https://twitter.com/water_ios_csic)

From 1.4.0 onwards is supported by **EURO GO-SHIP** (Grant #101094690), a EU-HORIZON project for _Developing a research infraestructure concept to support european hydrography_

## Installation

It's not essential for this software to run, but in order to take advantage of the main functionalities of this software program it is absolutly recommended to have [GNU Octave](https://www.gnu.org/software/octave/) installed, as most parameter calculations relies on Octave/Matlab code. Installers can be found [here](https://www.gnu.org/software/octave/download.html)

### Using built-in installers

* Windows x64: [ocean-data-qc-setup-1.4.0.exe](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc-setup-1.4.0.exe)
* macOS: [ocean-data-qc-1.4.0.dmg](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc-1.4.0.dmg)
* GNU/linux deb (Ubuntu, Debian,...): [ocean-data-qc_1.4.0_amd64.deb](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc_1.4.0_amd64.deb)
* GNU/Linux rpm (RedHat, SuSe, ...): [ocean-data-qc-1.4.0.x86_64.rpm](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc-1.4.0.x86_64.rpm)
* GNU/Linux snap: [ocean-data-qc_1.4.0_amd64.snap](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc_1.4.0_amd64.snap)
* GNU/Linux AppImage: [ocean-data-qc-1.4.0.AppImage](https://github.com/ocean-data-qc/ocean-data-qc/releases/download/v1.4.0/ocean-data-qc-1.4.0.AppImage)

Source code:
* latest: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.2603121.svg)](https://doi.org/10.5281/zenodo.2603121)
* v1.4.0: [https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.4.0.tar.gz](https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.4.0.tar.gz) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4532402.svg)](https://doi.org/10.5281/zenodo.4532402)
* v1.3.0: [https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.3.0.tar.gz](https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.3.0.tar.gz)
* v1.2.0: [https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.2.0.tar.gz](https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.2.0.tar.gz) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3470218.svg)](https://doi.org/10.5281/zenodo.3470218)
* v1.1.1: [https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.1.1.tar.gz](https://github.com/ocean-data-qc/ocean-data-qc/archive/v1.1.1.tar.gz) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3340975.svg)](https://doi.org/10.5281/zenodo.3340975)

### Manual Installation

1. Download and install base dependencies:
    1. Download and install [Python](https://www.python.org/download/releases/3.0/) >=3.8. Recommended downloader and instructions: [https://conda.io/miniconda.html](https://conda.io/miniconda.html)

    2. Download and install [yarn](https://yarnpkg.com/). Follow instructions from: https://yarnpkg.com/ (Alternatively  you can use [npm](https://www.npmjs.com/))

    3. Optional but very recommended for functionality: GNU Octave

        * Download and install GNU Octave. Follow instructions from: [https://www.gnu.org/software/octave/#install](https://www.gnu.org/software/octave/#install)

1. Download this project

1. Install the python `ocean_data_qc` package and its dependencies in your python setup (if you have installed python through miniconda/anaconda and is not in PATH, you have to use Anaconda Prompt as command shell):

        python setup.py develop
            or for non-root install in Linux:
        python setup.py develop --user

1. Install the node dependencies in the `ocean_data_qc_js` folder

        cd ocean_data_qc_js
        yarn install

1. Open the GUI from the `ocean_data_qc_js` folder

        cd ocean_data_qc_js
        yarn start               # or npm start
        (first time launching delays some time, please wait)

## Libraries and languages Used

* [**Electron**](https://electronjs.org/) (formerly known as Atom Shell). Electron is an open source library developed by GitHub for building cross-platform desktop applications with HTML, CSS, and JavaScript. Electron accomplishes this by combining Chromium and Node.js into a single runtime and apps can be packaged for Mac, Windows, and Linux. The application uses Electron to embed in an application the bokeh plots and drive the user interaction with interface, providing also all the menus and interfaces.

* [**Bokeh**](https://bokeh.pydata.org) (Python Library). Bokeh is an interactive visualization library that targets modern web browsers for presentation. Its goal is to provide elegant, concise construction of versatile graphics, and to extend this capability with high-performance interactivity over very large or streaming datasets. Bokeh is the main library for the application, as deals with graphic presentation and interaction (Bokeh Development Team (2014). Python library for interactive visualization. [http://www.bokeh.pydata.org](http://www.bokeh.pydata.org))

* [**Octave**](https://www.gnu.org/software/octave/). GNU Octave is a high-level interpreted language, primarily intended for numerical computations. It provides capabilities for the numerical solution of linear and nonlinear problems, and for performing other numerical experiments. It also provides extensive graphics capabilities for data visualization and manipulation. The GNU Octave language is quite similar to Matlab™ so that most programs are easily portable. The application uses GNU Octave to drive main oceanographic calculations, as it's actually the main used language in that field of work, and most typical Matlab™ open source oceanographic libraries were built in Matlab™. Running these calculations directly in GNU Octave allows to easy integrating code from researchers.

* [**Python**](https://www.python.org/). Python version 3 is the main language in the application. Most processing on data and files are performed through Pandas and/or NumPy libraries in python, and sent to Bokeh, which is also built on python and has an own javascript library for displaying and interacting. Python source code is presented in ocean_data_qc folder in the application.

* [**JavaScript**](https://developer.mozilla.org/es/docs/Web/JavaScript). Electron is built on node, that is built with JavaScript. All code for menus, screens, and interacting elements on the application are made with Javascript. Some of the functionality are provided directly by Electron and some other by Bokeh, but the code to merge all these things were built with JavaScript. JavaScript source code is presented in ocean_data_qc_js folder in the application.

## License

This project is licensed under the GPLv3 License - see the LICENSE file for details

## Authors

* @CSIC: Antón Velo <avelo@iim.csic.es>
* @CSIC: Jesús Cacabelos <jcacabelos@iim.csic.es>
* @GEOMAR: Nico Lange <nlange@geomar.de>
* @CSIC: Fiz F. Pérez <fiz.perez@iim.csic.es>
* @GEOMAR: Toste Tanhua <ttanhua@geomar.de>

## References

* [CO2SYS.m](https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1). CO2SYS version 1.1 (Sept 2011)
    >van Heuven, S., D. Pierrot, J.W.B. Rae, E. Lewis, and D.W.R. Wallace (2011) MATLAB Program Developed for CO2 System Calculations. ORNL/CDIAC-105b. Carbon Dioxide Information Analysis Center, Oak Ridge National Laboratory, U.S. Department of Energy, Oak Ridge, Tennessee. [https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1](https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1)

* [CANYON-B](https://github.com/HCBScienceProducts/CANYON-B). Adapted to run in this application
    >Bittig et al. (2018). An alternative to static climatologies: Robust estimation of open ocean CO2 variables and nutrient concentrations from T, S and O2 data using Bayesian neural networks. Front. Mar. Sci. 5:328. [http://dx.doi.org/10.3389/fmars.2018.00328](http://dx.doi.org/10.3389/fmars.2018.00328).

* Broullón, D., Pérez, F. F., Velo, A., Hoppema, M., Olsen, A., Takahashi, T., Key, R. M., Tanhua, T., González-Dávila, M., Jeansson, E., Kozyr, A.: [A global monthly climatology of total alkalinity: a neural network approach](https://doi.org/10.5194/essd-11-1109-2019), Earth Syst. Sci. Data, 11, 1109-1127, 2019 [https://doi.org/10.5194/essd-11-1109-2019](https://doi.org/10.5194/essd-11-1109-2019)

* Velo, A., Pérez, F.F., Tanhua, T., Gilcoto, M., Ríos, A.F., Key, R.M., 2013. [Total alkalinity estimation using MLR and neural network techniques](https://doi.org/10.1016/j.jmarsys.2012.09.002). Journal of Marine Systems 111–112, 0, 11–18. [https://doi.org/10.1016/j.jmarsys.2012.09.002](https://doi.org/10.1016/j.jmarsys.2012.09.002)

* Fernandes, . (2014, August 25). python-seawater v3.3.2 (Version v3.3.2). Zenodo. [http://doi.org/10.5281/zenodo.11395](http://doi.org/10.5281/zenodo.11395)
