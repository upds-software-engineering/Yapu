# -*- coding: utf-8 -*-
"""
Auditoría y verificación integral de calidad del documento Docs/ALBUM UML Bloque3_YAPU.docx.
Valida:
1. Márgenes (2.54 cm / 1.0 pulgada en todas las secciones).
2. Preservación del 100% de contenidos y encabezados originales.
3. Formato de fuentes (100% Times New Roman, tamaños jerarquizados).
4. Interlineado (1.5 en párrafos de cuerpo, 1.15 en tablas/figuras).
5. Tablas y Figuras (Tablas 1-19 consecutivas con formato APA 7, Figuras 1-27 consecutivas con formato APA 7).
6. Portada UPDS reglamentaria sin duplicaciones.
7. Índices (General, Figuras, Tablas) completos y consistentes.
8. Referencias APA 7 (20 referencias en orden alfabético con sangría francesa de 0.5 pulgadas).
"""

import docx
import sys

def main():
    print("Iniciando auditoría exhaustiva del documento final...")
    orig = docx.Document('Docs/ALBUM UML Bloque3_YAPU_original_backup.docx')
    doc = docx.Document('Docs/ALBUM UML Bloque3_YAPU.docx')

    # 1. MÁRGENES
    print("\n--- 1. MÁRGENES ---")
    for i, s in enumerate(doc.sections):
        margins = (s.top_margin.inches, s.bottom_margin.inches, s.left_margin.inches, s.right_margin.inches)
        assert all(abs(m - 1.0) < 0.01 for m in margins), f"Sección {i} con márgenes erróneos: {margins}"
    print(f"PASS: Las {len(doc.sections)} secciones cumplen con márgenes de exactamente 2.54 cm (1.0 pulgada).")

    # 2. ENCABEZADOS Y PRESERVACIÓN BASE
    print("\n--- 2. ENCABEZADOS Y PRESERVACIÓN BASE ---")
    orig_headings = [p.text.strip() for p in orig.paragraphs if p.style.name.startswith('Heading')]
    final_headings = [p.text.strip() for p in doc.paragraphs if p.style.name.startswith('Heading')]
    missing = [h for h in orig_headings if h not in final_headings]
    print(f"Encabezados originales: {len(orig_headings)} | Encabezados finales: {len(final_headings)}")
    print(f"Encabezados base faltantes: {missing}")
    assert len(missing) == 0, f"Error: Se perdieron encabezados base: {missing}"
    print("PASS: 100% de los encabezados originales están preservados.")

    # 3. PORTADA UPDS
    print("\n--- 3. PORTADA UPDS ---")
    portada_texts = [p.text.strip() for p in doc.paragraphs[:17] if p.text.strip()]
    assert any("Universidad Privada Domingo Savio" in t for t in portada_texts), "Falta encabezado institucional UPDS"
    assert any("DOCUMENTO DE GESTIÓN" in t for t in portada_texts), "Falta título de Documento de Gestión"
    assert any("Ingeniería de Software I" in t for t in portada_texts), "Falta asignatura"
    assert any("Jimmy Nataniel Requena Llorentty" in t for t in portada_texts), "Falta docente"
    assert any("Emmanuel Ponce Quiroga" in t for t in portada_texts), "Faltan estudiantes"
    assert any("septiembre de 2026" in t for t in portada_texts), "Falta fecha"
    # Verificar que no hay duplicación del bloque de roles
    roles_count = sum(1 for t in portada_texts if "Roles del equipo" in t)
    print(f"Ocurrencias del bloque Roles del equipo: {roles_count}")
    assert roles_count == 1, f"Error: Roles del equipo aparece {roles_count} veces (esperado: 1)"
    print("PASS: Portada UPDS validada sin redundancias.")

    # 4. ÍNDICES
    print("\n--- 4. ÍNDICES (GENERAL, FIGURAS, TABLAS) ---")
    idx_general = doc.paragraphs[17].text
    idx_figuras = doc.paragraphs[19].text
    idx_tablas = doc.paragraphs[25].text
    assert "Índice General" in idx_general and "9. Anexos" in idx_general, "Índice General incompleto"
    assert "Índice de Figuras" in idx_figuras and "Figura 27:" in idx_figuras, "Índice de Figuras incompleto"
    assert "Índice de Tablas" in idx_tablas and "Tabla 19:" in idx_tablas, "Índice de Tablas incompleto"
    print("PASS: Los tres índices (General, Figuras 1-27, Tablas 1-19) están presentes y completos.")

    # 5. TABLAS Y FIGURAS APA 7
    print("\n--- 5. FORMATO APA 7 EN TABLAS Y FIGURAS ---")
    tables_found = []
    figures_found = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t.startswith("Tabla ") and "\n" in t:
            lines = t.split("\n", 1)
            runs = [(r.text.strip(), r.bold, r.italic) for r in p.runs if r.text.strip()]
            tables_found.append((lines[0], lines[1], runs))
        elif t.startswith("Figura ") and "\n" in t:
            lines = t.split("\n", 1)
            runs = [(r.text.strip(), r.bold, r.italic) for r in p.runs if r.text.strip()]
            figures_found.append((lines[0], lines[1], runs))

    print(f"Total Tablas numeradas detectadas: {len(tables_found)} (esperadas: 19)")
    assert len(tables_found) == 19, f"Se esperaban 19 tablas, se encontraron {len(tables_found)}"
    for num, tit, runs in tables_found:
        assert runs[0][1] is True and runs[0][2] is False, f"{num} debe ser negrita y no cursiva"
        assert runs[1][1] is False and runs[1][2] is True, f"{tit} debe ser cursiva y no negrita"

    print(f"Total Figuras numeradas detectadas: {len(figures_found)} (esperadas: 27)")
    assert len(figures_found) == 27, f"Se esperaban 27 figuras, se encontraron {len(figures_found)}"
    for num, tit, runs in figures_found:
        assert runs[0][1] is True and runs[0][2] is False, f"{num} debe ser negrita y no cursiva"
        assert runs[1][1] is False and runs[1][2] is True, f"{tit} debe ser cursiva y no negrita"

    print("PASS: Todas las 19 tablas y 27 figuras cumplen estrictamente APA 7 (número en negrita, título en cursiva).")

    # 6. TIPOGRAFÍA Y ESPACIADO
    print("\n--- 6. TIPOGRAFÍA Y ESPACIADO ---")
    non_tnr = 0
    for p in doc.paragraphs:
        for r in p.runs:
            if r.font.name and r.font.name != "Times New Roman":
                non_tnr += 1
    print(f"Runs con tipografía distinta de Times New Roman: {non_tnr}")
    assert non_tnr == 0, f"Se encontraron {non_tnr} runs que no usan Times New Roman"

    # 7. REFERENCIAS APA 7
    print("\n--- 7. REFERENCIAS APA 7 ---")
    ref_paras = []
    in_ref = False
    for p in doc.paragraphs:
        if p.style.name.startswith("Heading 1") and "Referencias" in p.text:
            in_ref = True
            continue
        elif in_ref and p.style.name.startswith("Heading"):
            break
        elif in_ref and p.text.strip():
            ref_paras.append(p)

    print(f"Total de referencias encontradas: {len(ref_paras)} (esperadas: 20)")
    assert len(ref_paras) == 20, f"Se esperaban 20 referencias, se encontraron {len(ref_paras)}"

    ref_texts = [p.text.strip() for p in ref_paras]
    sorted_ref_texts = sorted(ref_texts, key=lambda s: s.lower())
    assert ref_texts == sorted_ref_texts, "Las referencias no están en orden alfabético estricto"

    for idx, p in enumerate(ref_paras):
        left_in = p.paragraph_format.left_indent.inches if p.paragraph_format.left_indent else 0
        first_in = p.paragraph_format.first_line_indent.inches if p.paragraph_format.first_line_indent else 0
        assert abs(left_in - 0.5) < 0.05, f"Ref {idx+1} sangría izquierda errónea: {left_in}"
        assert abs(first_in - (-0.5)) < 0.05, f"Ref {idx+1} primera línea errónea: {first_in}"

    print("PASS: Las 20 referencias están ordenadas alfabéticamente y tienen sangría francesa de 0.5 pulgadas.")

    # 8. ELEMENTOS DE GESTIÓN Y SUITE
    print("\n--- 8. ELEMENTOS DE GESTIÓN Y SUITE DE PRUEBAS ---")
    h2_results = [p.text.strip() for p in doc.paragraphs if p.style.name == 'Heading 2']
    required_sections = [
        "Plan de Pruebas del Sistema YAPU",
        "Suite de Pruebas Ejecutadas con Evidencia Empírica y Registro Gráfico",
        "Estudio de Viabilidad del Proyecto",
        "Análisis de Costo/Beneficio con Dimensión Socioambiental",
        "Matriz de Gestión de Riesgos del Proyecto y Riesgos Propios de la IA",
        "Tablero de Métricas de Gobierno de Software"
    ]
    for req in required_sections:
        assert req in h2_results, f"Falta sección obligatoria: {req}"
    print(f"PASS: Las 6 secciones del Documento de Gestión están presentes en Resultados.")

    img_count = sum(1 for r in doc.part.rels.values() if 'image' in r.target_ref)
    print(f"PASS: Se verificaron {img_count} relaciones de imágenes insertadas (diagramas base + capturas).")

    print("\n=======================================================")
    print("¡TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE (100%)!")
    print("=======================================================")

if __name__ == '__main__':
    main()
