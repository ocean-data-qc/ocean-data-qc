# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg

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

    def export_pdf(self):
        lg.warning('-- GENERATE PDF')

        # TODO: get all the list of plots grouped by tab

        # TODO: fix font problem
        p.output_backend = 'svg'
        export_svgs(p, filename='plot.svg')  # TODO: export in a temp folder

        # create a new SVG or a PDF with the new layout
        lg.warning('Reading drawing from plot.svg...')
        drawing = svg2rlg('plot.svg')
        p.output_backend = 'webgl'

        # drawing_list = get_plot()

        self._set_paper_sizes()
        self._build_data()
        self._build_table()
        self._build_story()

    def _set_paper_sizes(self):
        if LANDSCAPE:               # DIN A4: 210 × 297 mm
            PAGE_WIDTH = 297 * mm
        else:
            PAGE_WIDTH = 210 * mm

        MARGIN = 25 * mm
        CELL_PADDING = 3 * mm

        TABLE_WIDTH = PAGE_WIDTH - (MARGIN * 2)      # create a similar calculation for landscape paper
        COL_WIDTH = int(TABLE_WIDTH / NCOLS)         # integer value in points
        CELL_HEIGHT = int(TABLE_WIDTH / NCOLS) + CELL_PADDING * 2

    def _build_data(self):
        ''' Scale plots and create a data matrix
            in order to create the final table with reportlab
        '''
        lg.warning('-- BUILD DATA')

        sx = sy = COL_WIDTH / drawing.minWidth()   # drawing.minWidth() returns points as unit
        drawing.scale(sx, sy)

        def group_per_chunks(l, n):
            # Yield successive n-sized chunks from l
            for i in range(0, len(l), n):
                yield l[i:i + n]

        drawing_list = [drawing, drawing, drawing, drawing, drawing, ]
        data = list(group_per_chunks(drawing_list, NCOLS))
        if len(data[-1]) < NCOLS:
            data[-1] = data[-1] + [None] * (NCOLS - len(data[-1]))

        data.insert(0, ['TABNAME'] + [None] * (NCOLS - 1))

        # data.insert(1, [None] * NCOLS)  # separation

        print('DATA: {}'.format(data))


    def _build_table(self):
        lg.warning('-- BUILD DATA')

        table = Table(     # Flowable object
            data,
            colWidths=COL_WIDTH,
            rowHeights=[5 * mm + CELL_PADDING] + [CELL_HEIGHT] * (len(data) - 1),
            # hAlign='LEFT',
            repeatRows=1
        )

        table.setStyle(TableStyle([
            # ('GRID', (0,0), (-1,-1), 0.25, colors.black),

            # LEADING ROW
            ('LINEBELOW', (0, 0), (NCOLS - 1, 0), 0.5, colors.black),
            ('SPAN', (0, 0), (NCOLS - 1, 0)),                           # colspan
            ('FONTSIZE', (0, 0), (NCOLS - 1, 0), 12),

            ('BOTTOMPADDING', (0, 0), (-1, -1), CELL_PADDING),
            ('TOPPADDING', (0, 1), (-1, -1), CELL_PADDING),
        ]))

    def _build_story(self):
        story = []
        story.append(table)

        # doc = BaseDocTemplate(
        #     'reportlab_table_images.pdf', pagesize=A4,
        #     rightMargin=1, leftMargin=1,
        #     topMargin=1, bottomMargin=1
        # )

        doc = SimpleDocTemplate(
            'reportlab_table_images.pdf',
            pagesize=landscape(A4) if LANDSCAPE else A4,
            rightMargin=MARGIN, leftMargin=MARGIN,
            topMargin=MARGIN, bottomMargin=MARGIN
        )

        doc.build(story)