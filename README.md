# AtlantOS Ocean Data QC

Tool for 1st Quality Control on Hydrographic Cruise Data. The CSV files must have the [WHP format](https://www.nodc.noaa.gov/woce/woce_v3/wocedata_1/whp/exchange/exchange_format_desc.htm)

![](https://github.com/ocean-data-qc/ocean-data-qc/blob/master/ocean_data_qc_js/src/img/demo.gif?raw=true)

## Manual Installation

1. Download the project
2. Install the node dependencies in the `ocean_data_qc_js` folder

        npm install             # or yarn install

3. Install `ocean_data_qc` package and its dependencies in your python environment:

        python setup.py install

4. Open the GUI from the `ocean_data_qc_js` folder on the `site-packages` on your python environment folder

        npm start               # or yarn start

## Windows Releases

There will be releases with Windows installers so far. The app can be autoupdated with the new releases. If the autoupdate does not work, go to releases tab on the GitHub website, download and install the latest version.

## Technologies Used

* [**Electron**](https://electronjs.org/) (formerly known as Atom Shell) is an open-source framework developed and maintained by GitHub. Electron allows for the development of desktop GUI applications using front and back end components originally developed for web applications: Node.js runtime for the backend and Chromium for the frontend.
* [**Bokeh**](https://bokeh.pydata.org) (Python Library). Bokeh is an interactive visualization library that targets modern web browsers for presentation. Its goal is to provide elegant, concise construction of versatile graphics, and to extend this capability with high-performance interactivity over very large or streaming datasets.
* [**Octave**](https://www.gnu.org/software/octave/). AtlantOS Ocean Data QC uses some functions created within Octave in order to create calculated columns. If you want to make them work, you must install Octave and make the `octave` command available on your `PATH` environment variable. This is an optional feature.

## References

* [CO2SYS.m](https://github.com/jamesorr/CO2SYS-MATLAB). There are files from this repository included in this project:

    > **About CO2SYS**. Here you will find a MATLAB-version of CO2SYS, originally written for DOS. CO2SYS calculates and returns a detailed state of the carbonate system for oceanographic water samples, if supplied with sufficient input.
    >
    > [...]
    >
    > van Heuven, S., D. Pierrot, J.W.B. Rae, E. Lewis, and D.W.R. Wallace (2011) MATLAB Program Developed for CO2 System Calculations. ORNL/CDIAC-105b. Carbon Dioxide Information Analysis Center, Oak Ridge National Laboratory, U.S. Department of Energy, Oak Ridge, Tennessee. https://doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1
