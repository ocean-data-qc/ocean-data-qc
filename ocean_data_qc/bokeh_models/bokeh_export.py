# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

from bokeh.util.logconfig import bokeh_logger as lg
from os import path, mkdir, unlink, listdir
from shutil import rmtree
import json
import base64
from io import BytesIO

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate
from reportlab.lib import colors
from reportlab.lib.units import mm

from ocean_data_qc.env import Environment
from ocean_data_qc.constants import *

from reportlab.lib.utils import ImageReader
from reportlab.platypus import Image

# TODO: move this parameters to the shared_data.json file?

class BokehExport(Environment):
    ''' Export plots in PNG, SVG. All files will be gathered in a ZIP file or PDF
    '''
    env = Environment

    def __init__(self, **kwargs):
        lg.info('-- INIT BOKEH EXPORT')
        self.env.bk_export = self

        self.tab_img = {}
        self.table_list = []
        self.drawing_list = []
        self.margin = None
        self.cell_padding = None
        self.col_width = None
        self.col_height = None

    def export_pdf(self, args=None):
        lg.warning('-- GENERATE PDF WITH PLOTS IN PNG FORMAT')
        export_pdf = self.env.f_handler.get('export_pdf', PROJ_SETTINGS)
        lg.warning('>> PROJ_SETTINGS, EXPORT_PDF: {}'.format(export_pdf))

        self.landscape = export_pdf.get('landscape', False)
        self.ncols = export_pdf.get('ncols', 2)
        self.width = export_pdf.get('width', 80) * mm

        tabs_images = args.get('tabs_images', None)
        self.save_png_images(tabs_images)
        self._prep_directory()

        self._set_paper_sizes()
        tabs_order = args.get('tabs_order', None)
        self._build_tables(tabs_order)
        self._build_story()

        return {'success': True }

    def _prep_directory(self):
        if not path.exists(EXPORT):
            mkdir(EXPORT)       # TODO: remove folder when the process is finished
        else:
            lg.warning('Directory {} already exists. Cleaning...'.format(EXPORT))
            for the_file in listdir(EXPORT):
                file_path = path.join(EXPORT, the_file)
                try:
                    if path.isfile(file_path):
                        unlink(file_path)
                    #elif path.isdir(file_path): shutil.rmtree(file_path)
                except Exception as e:
                    lg.warning('Directory {} could not be cleaned'.format(EXPORT))

    def _set_paper_sizes(self):
        if self.landscape:               # DIN A4: 210 × 297 mm
            page_width = 297 * mm
        else:
            page_width = 210 * mm

        self.margin = 25 * mm
        self.cell_padding = 3 * mm

        table_width = page_width - (self.margin * 2)      # create a similar calculation for landscape paper
        self.col_width = int(table_width / self.ncols)         # integer value in points
        self.col_height = int(table_width / self.ncols) + self.cell_padding * 2

    def _build_data(self, tab_name):
        ''' Create a data matrix with the plot images
            in order to create the final table with reportlab
        '''
        lg.warning('-- BUILD DATA')
        def group_per_chunks(l, n):
            # Yield successive n-sized chunks from l
            for i in range(0, len(l), n):
                yield l[i:i + n]

        data = list(group_per_chunks(self.tab_img[tab_name], self.ncols))
        if len(data[-1]) < self.ncols:
            data[-1] = data[-1] + [None] * (self.ncols - len(data[-1]))

        data.insert(0, [tab_name] + [None] * (self.ncols - 1))  # Title
        # data.insert(1, [None] * self.ncols)  # separation

        print('DATA: {}'.format(data))
        return data

    def _build_tables(self, tabs_order=None):
        lg.warning('-- BUILD DATA')
        if tabs_order is not None:
            for tab_name in tabs_order:
                data = self._build_data(tab_name)

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
                    ('LINEBELOW', (0, 0), (self.ncols - 1, 0), 0.5, colors.black),
                    ('SPAN', (0, 0), (self.ncols - 1, 0)),                           # colspan
                    ('FONTSIZE', (0, 0), (self.ncols - 1, 0), 12),

                    ('BOTTOMPADDING', (0, 0), (-1, -1), self.cell_padding),
                    ('TOPPADDING', (0, 1), (-1, -1), self.cell_padding),
                ]))
                self.table_list.append(table)

        lg.warning('>> SELF.TABLE_LIST: {}'.format(self.table_list))

    def _build_story(self):
        lg.warning('-- Building reportlab story')
        story = []
        for table in self.table_list:
            story.append(table)
        doc = SimpleDocTemplate(
            path.join(EXPORT, 'plot_images.pdf'),
            pagesize=landscape(A4) if self.landscape else A4,
            rightMargin=self.margin, leftMargin=self.margin,
            topMargin=self.margin, bottomMargin=self.margin
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

    def scale_png_image(self, fileish, width: int) -> Image:
        """ scales image with given width. fileish may be file or path """
        img = ImageReader(fileish)
        orig_width, height = img.getSize()
        aspect = height / orig_width
        return Image(fileish, width=width, height=width * aspect)

    def save_png_images(self, tabs_images=None):
        ''' base64_images is a string, the result to convert it in an object:
            INPUT >>

            {
                '0': [
                    "data:image/png;base64,iVBORw0KGgoAAAANSUh .... ",
                    "data:image/png;base64,sdfsdgrgwergweERGWErgWERGwh .... ",
                ]
                '1': ["data:image/png;base64,iVBORw0KGgoAAAANSUh .... "]
            }

            OUTPUT >>

            self.tab_img = {
                'SALNTY': [
                    Platypus Flowable Image,
                    Platypus Flowable Image,
                ]
                'CTMTMP': [Image obj]
            }
        '''
        lg.warning('-- SAVE PNG IMAGES')
        if tabs_images is not None:
            for key in tabs_images.keys():
                self.tab_img[key] = []
                for img in tabs_images[key]:
                    img = bytes(img.split(',')[1], 'ascii')  # ascii is the default encoding?
                    img = base64.b64decode(img)
                    img_bytes = BytesIO(img)
                    img_bytes.seek(0)
                    scaled_image = self.scale_png_image(fileish=img_bytes, width=self.width)
                    self.tab_img[key].append(scaled_image)

    def prep_bigger_plots(self):
        lg.warning('-- PREP BIGGER PLOTS')

        for bp in self.env.bk_plots:
            big_width = 2
            bp.plot.title.text_font_size = '20pt'
            bp.plot.xaxis.axis_line_width = big_width
            bp.plot.yaxis.axis_line_width = big_width
            bp.plot.xaxis.axis_label_text_font_size = '15pt'
            bp.plot.yaxis.axis_label_text_font_size = '15pt'

            bp.plot.xaxis.major_tick_line_width = big_width
            bp.plot.yaxis.major_tick_line_width = big_width
            bp.plot.xaxis.minor_tick_line_width = big_width
            bp.plot.yaxis.minor_tick_line_width = big_width

            bp.plot.xaxis.major_label_text_font_size = '10pt'
            bp.plot.yaxis.major_label_text_font_size = '10pt'