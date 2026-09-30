# -*- coding: utf-8 -*-
"""
Script maestro para regenerar e integrar el Documento de Gestión completo
en Docs/ALBUM UML Bloque3_YAPU.docx preservando todo el contenido existente.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os
import shutil

DOC_PATH = 'Docs/ALBUM UML Bloque3_YAPU.docx'
BACKUP_PATH = 'Docs/ALBUM UML Bloque3_YAPU_original_backup.docx'

def run():
    print("Iniciando actualización integral del documento...")
    
    # 1. Asegurar que tenemos copia de respaldo intacta
    if not os.path.exists(BACKUP_PATH):
        shutil.copyfile(DOC_PATH, BACKUP_PATH)
        
    doc = docx.Document(BACKUP_PATH)
    
    # Helper para formatear párrafos
    def fmt_p(p, font="Times New Roman", size=12, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, space_before=0, line_spacing=1.5):
        p.alignment = align
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        for r in p.runs:
            r.font.name = font
            r.font.size = Pt(size)
            if bold: r.font.bold = True
            if italic: r.font.italic = True

    # Helper para agregar títulos jerárquicos APA
    def add_h(doc, text, level):
        h = doc.add_heading(text, level=level)
        fmt_p(h, font="Times New Roman", size=13 if level==1 else 12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=6, line_spacing=1.15)
        return h

    # Helper para agregar párrafos de texto
    def add_p(doc, text, italic=False):
        p = doc.add_paragraph()
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        if italic: r.font.italic = True
        fmt_p(p, font="Times New Roman", size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, space_before=0, line_spacing=1.5)
        return p

    # Helper para bordes de tablas
    def set_table_borders(table):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="8" w:space="0" w:color="334155"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="334155"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def set_cell_shading(cell, color_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    # Helper para tablas APA numeradas
    def add_table_apa(doc, tbl_num, title, headers, rows_data, col_widths=None):
        # Título APA: Tabla X en negrita, título en cursiva
        p_num = doc.add_paragraph()
        r_num = p_num.add_run(f"Tabla {tbl_num}")
        r_num.font.name = "Times New Roman"
        r_num.font.size = Pt(11)
        r_num.font.bold = True
        fmt_p(p_num, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=2, line_spacing=1.15)
        
        p_tit = doc.add_paragraph()
        r_tit = p_tit.add_run(title)
        r_tit.font.name = "Times New Roman"
        r_tit.font.size = Pt(11)
        r_tit.font.italic = True
        fmt_p(p_tit, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15)

        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl)

        for col_idx, h_text in enumerate(headers):
            cell = tbl.cell(0, col_idx)
            cell.text = h_text
            set_cell_shading(cell, "1E293B")
            set_cell_margins(cell, 120, 120, 140, 140)
            p = cell.paragraphs[0]
            fmt_p(p, font="Times New Roman", size=9.5, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, line_spacing=1.0)
            p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

        for r_idx, r_vals in enumerate(rows_data):
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(r_vals):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.text = str(val)
                set_cell_shading(cell, bg)
                set_cell_margins(cell, 80, 80, 120, 120)
                p = cell.paragraphs[0]
                fmt_p(p, font="Times New Roman", size=9, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=2, line_spacing=1.15)

        if col_widths:
            for row in tbl.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = Inches(width)

        # Espacio post tabla
        p_post = doc.add_paragraph()
        fmt_p(p_post, space_before=0, space_after=6)
        return tbl

    # Helper para figuras APA numeradas
    def add_fig_apa(doc, fig_num, title, img_path, note, width=6.0):
        p_num = doc.add_paragraph()
        r_num = p_num.add_run(f"Figura {fig_num}")
        r_num.font.name = "Times New Roman"
        r_num.font.size = Pt(11)
        r_num.font.bold = True
        fmt_p(p_num, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=2, line_spacing=1.15)
        
        p_tit = doc.add_paragraph()
        r_tit = p_tit.add_run(title)
        r_tit.font.name = "Times New Roman"
        r_tit.font.size = Pt(11)
        r_tit.font.italic = True
        fmt_p(p_tit, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15)

        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fmt_p(p_img, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4)
        r_img = p_img.add_run()
        if os.path.exists(img_path):
            r_img.add_picture(img_path, width=Inches(width))
        else:
            r_img.add_text(f"[Imagen no encontrada: {img_path}]")

        p_nota = doc.add_paragraph()
        r_nota_lbl = p_nota.add_run("Nota. ")
        r_nota_lbl.font.name = "Times New Roman"
        r_nota_lbl.font.size = Pt(10)
        r_nota_lbl.font.italic = True
        r_nota_txt = p_nota.add_run(note)
        r_nota_txt.font.name = "Times New Roman"
        r_nota_txt.font.size = Pt(10)
        fmt_p(p_nota, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=2, space_after=12, line_spacing=1.15)

    print("Definiciones base listas. Procediendo a actualizar...")
    return doc, add_h, add_p, add_table_apa, add_fig_apa, fmt_p

if __name__ == '__main__':
    doc, add_h, add_p, add_table_apa, add_fig_apa, fmt_p = run()
    print("Módulo de generación preparado.")
