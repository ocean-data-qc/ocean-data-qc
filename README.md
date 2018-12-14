# AtlantOS Ocean Data QC

Tool for 1st Quality Control on Hydrographic Cruise Data. The CSV files must have the [WHP format](https://www.nodc.noaa.gov/woce/woce_v3/wocedata_1/whp/exchange/exchange_format_desc.htm)

![flagging_example](ocean_data_js/src/img/update_flag_values.gif)

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

* **Electron** (formerly known as Atom Shell) is an open-source framework developed and maintained by GitHub. Electron allows for the development of desktop GUI applications using front and back end components originally developed for web applications: Node.js runtime for the backend and Chromium for the frontend.
* **Bokeh** (Python Library). Bokeh is an interactive visualization library that targets modern web browsers for presentation. Its goal is to provide elegant, concise construction of versatile graphics, and to extend this capability with high-performance interactivity over very large or streaming datasets.
* [**Octave**](https://www.gnu.org/software/octave/). AtlantOS Ocean Data QC uses some functions created within Octave in order to create calculated columns. If you want to make them work, you must install Octave and make the `octave` command available on your `PATH` environment variable. This is an optional feature.
