# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from os import path, mkdir
from shutil import rmtree

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *

# TODO: move this parameters to the shared_data.json file?
LANDSCAPE = False
NCOLS = 3

class BokehExport(Environment):
    ''' Export plots in PNG, SVG. All files will be gathered in a ZIP file or PDF
    '''
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH EXPORT')
        self.env.bk_export = self

        self.table_list = []
        self.drawing_list = []
        self.margin = None
        self.cell_padding = None
        self.col_width = None
        self.col_height = None

    def export_pdf(self):
        lg.warning('-- GENERATE PDF')

        return {'success': True}

        # TODO: fix font problem

        self._prep_directory()

        i = 0

        for p in self.env.bk_plots:
            p.output_backend = 'svg'

            # export_svgs(obj, filename=None, height=None, width=None, webdriver=None, timeout=5)
            export_svgs(
                obj=p,
                filename=path.join(EXPORT, 'plot{}.svg'.format(i))
            )

            # create a new SVG or a PDF with the new layout
            lg.warning('Reading drawing from plot.svg...')
            self.drawing_list.append(svg2rlg(
                path.join(EXPORT, 'plot{}.svg'.format(i))
            ))
            p.output_backend = 'webgl'
            i += 1

        self._set_paper_sizes()
        self._build_tables()
        self._build_story()

    def _prep_directory(self):
        if not path.exists(EXPORT):
            mkdir(EXPORT)       # TODO: remove folder when the process is finished
        else:
            lg.warning('Directory {} already exists. Cleaning...'.format(EXPORT))
            for the_file in os.listdir(EXPORT):
                file_path = path.join(EXPORT, the_file)
                try:
                    if path.isfile(file_path):
                        os.unlink(file_path)
                    #elif os.path.isdir(file_path): shutil.rmtree(file_path)
                except Exception as e:
                    lg.warning('Directory {} could not be cleaned'.format(EXPORT))

    def _set_paper_sizes(self):
        if LANDSCAPE:               # DIN A4: 210 × 297 mm
            page_width = 297 * mm
        else:
            page_width = 210 * mm

        self.margin = 25 * mm
        self.cell_padding = 3 * mm

        table_width = page_width - (self.margin * 2)      # create a similar calculation for landscape paper
        self.col_width = int(table_width / NCOLS)         # integer value in points
        self.col_height = int(table_width / NCOLS) + self.cell_padding * 2

    def _build_data(self, tab_name):
        ''' Scale plots and create a data matrix
            in order to create the final table with reportlab
        '''
        lg.warning('-- BUILD DATA')

        sx = sy = self.col_width / drawing.minWidth()   # drawing.minWidth() returns points as unit
        drawing.scale(sx, sy)

        def group_per_chunks(l, n):
            # Yield successive n-sized chunks from l
            for i in range(0, len(l), n):
                yield l[i:i + n]

        drawing_sublist = [self.drawing_list[p] for p in self.env.tabs_flags_plots[tab_name]['plots']]
        data = list(group_per_chunks(drawing_sublist, NCOLS))
        if len(data[-1]) < NCOLS:
            data[-1] = data[-1] + [None] * (NCOLS - len(data[-1]))

        data.insert(0, [tab_name] + [None] * (NCOLS - 1))

        # data.insert(1, [None] * NCOLS)  # separation

        print('DATA: {}'.format(data))
        return data


    def _build_tables(self):
        lg.warning('-- BUILD DATA')
        for tab_name in list(self.env.tabs_flags_plots.keys()):
            data = self.build_data(tab_name)

            table = Table(     # Flowable object
                data,
                colWidths=self.col_width,
                rowHeights=[5 * mm + self.cell_padding] + [self.col_height] * (len(data) - 1),
                # hAlign='LEFT',
                repeatRows=1
            )

            table.setStyle(TableStyle([
                # ('GRID', (0,0), (-1,-1), 0.25, colors.black),

                # LEADING ROW
                ('LINEBELOW', (0, 0), (NCOLS - 1, 0), 0.5, colors.black),
                ('SPAN', (0, 0), (NCOLS - 1, 0)),                           # colspan
                ('FONTSIZE', (0, 0), (NCOLS - 1, 0), 12),

                ('BOTTOMPADDING', (0, 0), (-1, -1), self.cell_padding),
                ('TOPPADDING', (0, 1), (-1, -1), self.cell_padding),
            ]))
            self.table_list.append(table)

    def _build_story(self):
        lg.warning('-- Building reportlab story')
        story = []
        story.append(table)
        doc = SimpleDocTemplate(
            path.join(EXPORT, 'exported_plots.pdf'),
            pagesize=landscape(A4) if LANDSCAPE else A4,
            rightself.margin=self.margin, leftself.margin=self.margin,
            topself.margin=self.margin, bottomself.margin=self.margin
        )
        doc.build(story)

    def _clean(self):
        lg.warning('-- CLEAN BOKEH EXPORT')
        self.table_list = []
        self.drawing_list = []
        self.margin = None
        self.cell_padding = None
        self.col_width = None
        self.col_height = None
        try:
            if path.exists(EXPORT):
                rmtree(EXPORT)
        except Exception as e:
            lg.warning('Temp "export" directory could not be cleaned: {}'.format(e))