# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg


class Environment(object):
    ''' This class is used to shared all the vbles across the application.
        This are visible on the python classes of the folders.
            * bokeh_models through the class Environment
            * data_models through the class SharedCruiseData

        This class is created to avoid sending shared variables to
        the other classes constructors. Like this the variables are
        always updated. This should be done in the rest of classes:

            from ocean_data_qc.env import Environment

            [...]

                self.env = Environment

        NOTE: Here I cannot instantiate the other objects as children >> recursive inheritance
    '''
    # ------------------------------- LAYOUT ------------------------------------- #

    doc = None                      # pointer to curdoc()
    ly = None                       # main bokeh layout

    bridge_row = None               # messages bridge row to add to the layout
    tabs = None                     # tabs structure
    cur_plotted_cols = []           # Current columns list used in all the plots

    sidebar = None                  # sidebar, actually it is a column
    tabs_widget = None              # tabs widget
    flagger_select = None           # flag selection widget
    wmts_map = None                 # tile server map
    wmts_map_scatter = None         # scatter for the tile server map
    flags_control_col = None        # flags control column (visibility and flag updates)
    show_titles = False             # Whether show titles on plots or not

    # ------------------------------- SOURCES ------------------------------------- #

    # TODO: rename source > src

    df = None                       # main dataframe with all the data of the current project
    data = None                     # Original Data() object
    source = None                   # Complete ColumnDataSource
    cds_df = None                   # Dataframe for the main CDS
    ml_src = None                # Multiline Profiles CDS
    pc_src = None                # Profile circles´s source, column name example:
                                    # NITRAT_NITRAT_2 (TAB_COLUMN_PROFNUMBER)
    astk_src = None          # Asterisk CDS >> 0 or 1 (if at least one point is selected)
                                    # The lines with all the columns are store in thos source
    flag_views = {}                 # Views that are shared in all plots of a tab
    wmts_map_source = None          # Map source
    wmts_map_df = None              # Map DataFrame

    # ------------------------------- VARIABLES ------------------------------------- #

    oct_exe_path = ''               # path where the octave executable is

    n_plots = 0                     # Number of plots. This value should be updated if the number changes
                                    #    There is an alternative variable on the BokehPlotsHandler class
    ranges = {}                     # Ranges for all the plots. Each attribute should have x_range and y_range
    stations = []                   # List of current stations used without duplicates
    visible_flags = []              # List of flags numbers that are currently visible
    selection = []                  # List of selected indices
    map_selection = []              # Stations selected on the map plot
    cur_partial_stt_selection = []  # Current partial stt selection
    sample_to_select = None         # Index of the current selected sample on the selection list
    stt_to_select = None            # Station of the current selected sample (float value)
    plot_prof_invsbl_points = False # Whether if the profiles should plot the visible points or the invisible as well
    plot_nearby_prof = False        # Whether if the nearby profile should be plotted
    reset_selection = False         # To check if the selection should be reset or not
    profile_colors = []             # List of colors for the profiles circles, RED at the end
    cur_nearby_prof = None          # Current extra shown extension
    tabs_flags_plots = {}           # Stores the tab, the current flag for the tab and the current plots for the tab
    qc_plot_tabs = {}               # Stores the title and columns in every tab
    cur_flag = None                 # Current selected flag, one different per tab
    cur_tab = None                  # Current selected tab
    tab_change = False              # True if the tab was currently changed
    all_flags = {}                  # Dictionary with all the current flags in the DF {2: 'FLAG 2', 3: 'FLAG 3', ...}
    dt_manual_update = False        # This should be True if a flag datatable values is updated manually with the keyboard
    ts_state = None

    # TODO: these two flags are only used in the bokeh_table class, so they are not needed on the env variable
    dt_next_sample = False          # Flag to make difference when the DataTable is updated from the "Next Sample" button
    dt_previous_sample = False      # Flag to make difference when the DataTable is updated from the "Previous Sample" button

    # ------------------------------------ OBJECTS ---------------------------------------- #

    bk_sources = None
    bk_plots = []                   # List of plot objects
    bk_plots_handler = None
    bk_loader = None
    bk_table = None
    bk_flags = None
    bk_events = None
    bk_layout = None

    bk_bridge = None                # Messages Bridge object
    f_handler = None                # Files handler (mainly to extract and update JSON files), tabs are managed here as well
    cruise_data = None              # Cruise Data object
    cd_handler = None               # Cruise Data Handler
    cd_update = None                # Cruise Data Update, update values from a similar CSV file
    cd_aux = None                   # Cruise Data Auxiliar, used to make comparisons in with cd_update
    cp_param = None                 # Computer Parameters
    oct_eq = None                   # Octave Executable Path Manager
