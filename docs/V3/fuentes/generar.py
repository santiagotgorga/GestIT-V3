# -*- coding: utf-8 -*-
"""
Genera los documentos de V3 a partir de casos_v3.py:
  - docs/V3/04-Casos-de-Prueba-V3.md
  - docs/V3/TPO - TC and Defect Template GRUPO12 - V3.xlsx (sobre la planilla de V2 del grupo)

Uso:  python docs/V3/fuentes/generar.py "<planilla V2 .xlsx>" [reporte-regresion.json]
"""
import copy
import json
import os
import sys

import openpyxl
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side

sys.path.insert(0, os.path.dirname(__file__))
from casos_v3 import CASOS, DEFECTOS  # noqa: E402

def _manuales():
    ruta = os.path.join(os.path.dirname(__file__), "resultados_v3.json")
    if not os.path.exists(ruta):
        return {}, ""
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("resultados", {}), data.get("ejecutado_por", "")


MANUALES_RES, EJECUTOR = _manuales()
ABIERTOS_V3 = ("BUG-09", "BUG-10", "BUG-11")
AUTO_RES = {}  # defectos encontrados en la ejecución de V3, entregados abiertos

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DOCS = os.path.join(RAIZ, "docs", "V3")

AUTOMATIZADOS = ["TC-01", "TC-02", "TC-03", "TC-04", "TC-05", "TC-06", "TC-07", "TC-09", "TC-10", "TC-12",
                 "TC-15", "TC-16", "TC-17", "TC-18", "TC-19", "TC-20", "TC-21", "TC-23", "TC-24", "TC-25",
                 "TC-29", "TC-30", "TC-31", "TC-32", "TC-34", "TC-35", "TC-36", "TC-40", "TC-45", "TC-46", "TC-48"]
MANUALES = ["TC-08", "TC-11", "TC-13", "TC-14", "TC-26", "TC-33", "TC-39", "TC-41", "TC-42", "TC-43", "TC-44"]
NO_EJECUTADOS = ["TC-22", "TC-27", "TC-28", "TC-37", "TC-38", "TC-47"]


# ---------------------------------------------------------------- Markdown
def generar_markdown():
    l = ["# GestIT — Casos de prueba de V3", "",
         "Testing de Aplicaciones · UADE · Grupo 12", "",
         "> Casos **nuevos** de V3: confirmación de los defectos de V2 (TC‑49 a TC‑56) y casos de las HU nuevas o",
         "> modificadas (TC‑57 a TC‑82). Se ejecutan **manualmente** (consigna de la Entrega 03). La misma información",
         "> está en la planilla `TPO - TC and Defect Template GRUPO12 - V3.xlsx`, una hoja por caso.", "",
         "Los datos iniciales son los de la sección 2.2 de los requerimientos. Antes de cada caso conviene restaurar los",
         "datos con `POST /api/test/reset` (RNF‑09), salvo que el caso diga otra cosa.", "",
         "## Resumen", "",
         "| TC | Descripción | HU | Tipo | Técnica | Prioridad |", "|---|---|---|---|---|---|"]
    for c in CASOS:
        l.append(f"| {c['id']} | {c['desc']} | {c['hu']} | {c['tipo']} | {c['tecnica']} | {c['prioridad']} |")
    total = len(CASOS)
    conf = sum(1 for c in CASOS if c["tipo"] == "Confirmación")
    l += ["", f"**Total: {total} casos** ({conf} de confirmación y {total - conf} nuevos de V3).", ""]

    for c in CASOS:
        l += [f"## {c['id']} · {c['desc']}", "",
              f"- **HU cubiertas:** {c['hu']} · **Prioridad:** {c['prioridad']} · **Tipo:** {c['tipo']}",
              f"- **Técnica de diseño:** {c['tecnica']}",
              f"- **Prerrequisitos:** " + " ".join(c["pre"]),
              f"- **Datos de prueba:** " + " · ".join(f"`{d}`" for d in c["datos"]), "",
              "| Paso | Acción | Resultado esperado |", "|---|---|---|"]
        for i, (paso, esperado) in enumerate(c["pasos"], 1):
            l.append(f"| {i} | {paso} | {esperado} |")
        l.append("")
    with open(os.path.join(DOCS, "04-Casos-de-Prueba-V3.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(l))


# ---------------------------------------------------------------- Excel
def estilo(origen, destino):
    destino.font = copy.copy(origen.font)
    destino.fill = copy.copy(origen.fill)
    destino.border = copy.copy(origen.border)
    destino.alignment = copy.copy(origen.alignment)
    destino.number_format = origen.number_format


def fila_estilos(ws, fila):
    return [ws.cell(row=fila, column=c) for c in range(1, 6)]


def hoja_caso(wb, plantilla, caso):
    ws = wb.copy_worksheet(plantilla)
    ws.title = caso["id"]
    # Estilos de referencia tomados de la hoja de V2 (TC-07)
    st = {n: [copy.copy(x) for x in fila_estilos(plantilla, n)] for n in (7, 8, 16, 18, 20, 21, 26, 27)}

    for rango in list(ws.merged_cells.ranges):
        if rango.min_row >= 7:
            ws.unmerge_cells(str(rango))
    ws.delete_rows(7, ws.max_row)

    ws["B1"] = caso["id"]
    ws["D1"] = caso["desc"]
    res = MANUALES_RES.get(caso["id"])
    ws["B2"] = "Grupo 12"
    ws["D2"] = EJECUTOR if res else "A completar"
    ws["B3"] = res["estado"] if res else "Pendiente"
    ws["E3"] = 3.0
    ws["B5"] = caso["prioridad"]

    def poner(fila, ref, valores):
        for col, val in enumerate(valores, 1):
            celda = ws.cell(row=fila, column=col, value=val)
            estilo(st[ref][col - 1], celda)

    fila = 7
    poner(fila, 7, ["S #", "Prerequisites:", None, "S #", "Test Data"])
    n = max(len(caso["pre"]), len(caso["datos"]), 4)
    for i in range(n):
        fila += 1
        poner(fila, 8, [float(i + 1), caso["pre"][i] if i < len(caso["pre"]) else None, None,
                        float(i + 1), caso["datos"][i] if i < len(caso["datos"]) else None])
    fila += 2
    poner(fila, 16, ["Test Scenario", caso["desc"], None, None, None])
    ws.merge_cells(start_row=fila, start_column=1, end_row=fila + 1, end_column=1)
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila + 1, end_column=5)
    fila += 2
    poner(fila, 18, ["User Stories covered", caso["hu"], None, "Automation Status", "Not Automated"])
    fila += 2
    poner(fila, 20, ["Step #", "Step Details", None, "Expected Results", None])
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=3)
    ws.merge_cells(start_row=fila, start_column=4, end_row=fila, end_column=5)
    for i, (paso, esperado) in enumerate(caso["pasos"], 1):
        fila += 1
        poner(fila, 21, [float(i), paso, None, esperado, None])
        ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=3)
        ws.merge_cells(start_row=fila, start_column=4, end_row=fila, end_column=5)
        ws.row_dimensions[fila].height = 45
    fila += 2
    poner(fila, 26, ["Actual Result (V3)", res["obtenido"] if res else "A completar al ejecutar.", None, None, None])
    ws.row_dimensions[fila].height = 60 if res and len(res["obtenido"]) > 120 else 30
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=5)
    fila += 1
    poner(fila, 27, ["Técnica de diseño", caso["tecnica"], None, "Tipo de prueba", caso["tipo"]])
    return ws


def hoja_defecto(wb, plantilla, d):
    ws = wb.copy_worksheet(plantilla)
    ws.title = f"Defect Report - {d[0]}"
    st_label = copy.copy(plantilla["A1"])
    st_valor = copy.copy(plantilla["B1"])
    for row in ws.iter_rows():
        for c in row:
            c.value = None
    campos = [
        ("ID", d[0]), ("Title", d[1]), ("Description / Overview", d[2]),
        ("Reproduction Steps", "\n".join(d[3])), ("Expected Behavior", d[4]),
        ("Actual Behavior (V3)" if d[0] in ABIERTOS_V3 else "Actual Behavior (V2)", d[5]),
        ("Incidence / Severity / Probability of reproduction", d[6]),
        ("Story and Acceptance Criteria affected", d[7]), ("Root cause", d[8]),
        ("Confirmation testing (V3)", f"{d[9]}." if d[0] in ABIERTOS_V3
         else f"{d[9]} (caso de confirmación): {MANUALES_RES.get(d[9], {}).get('estado', 'pendiente')}."),
        ("Status", "Abierto: encontrado en la ejecución de V3, a corregir en la próxima versión."
         if d[0] in ABIERTOS_V3 else "Corregido en V3 y confirmado por QA (ver caso de confirmación)."),
        ("Browsers tested", "V3: Chrome en Windows (Santiago Gorga)" if d[0] in ABIERTOS_V3 else "V2: Chromium 157 · curl"), ("Environment", "Entorno local (localhost:3000)."),
        ("Notes", "Encontrado en la ejecución manual de V3 (ver 02-Reportes-de-Defectos-V3.md)." if d[0] in ABIERTOS_V3
         else "Encontrado en la sesión de testing exploratorio con charters sobre V2 (ver 02-Reportes-de-Defectos-V3.md)."),
    ]
    for i, (etiqueta, valor) in enumerate(campos):
        fila = 1 + i * 2
        a = ws.cell(row=fila, column=1, value=etiqueta)
        b = ws.cell(row=fila, column=2, value=valor)
        estilo(st_label, a)
        estilo(st_valor, b)
        b.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[fila].height = 60 if len(str(valor)) > 90 else 30
    return ws


def resultados_automatizados(ruta_json):
    if not ruta_json or not os.path.exists(ruta_json):
        return {}
    data = json.load(open(ruta_json, encoding="utf-8"))
    res = {}

    def recorrer(suite):
        for t in suite.get("tests", []):
            res[t["title"].split(" ")[0]] = "PASS" if t["pass"] else ("FAIL" if t["fail"] else "BLOCKED")
        for s in suite.get("suites", []):
            recorrer(s)
    for r in data["results"]:
        recorrer(r)
    return res


def hoja_resumen(wb, tcs_v2, auto):
    ws = wb.create_sheet("Resumen V3", 0)
    negrita = Font(bold=True, color="FFFFFF")
    relleno = PatternFill("solid", fgColor="1F4E78")
    borde = Border(*(Side(style="thin", color="BFBFBF"),) * 4)
    enc = ["Test Case ID", "Descripción", "HU cubiertas", "Tipo", "Prioridad", "Decisión V3",
           "Estado V1", "Estado V2", "Estado V3", "Resultado obtenido (V3)", "Ejecutado por"]
    ws.append(enc)
    for i, h in enumerate(enc, 1):
        c = ws.cell(row=1, column=i)
        c.font, c.fill, c.alignment = negrita, relleno, Alignment(wrap_text=True, vertical="center")

    for t in tcs_v2:
        i = t["id"]
        if i in AUTOMATIZADOS:
            dec, est = "Regresión automatizada (Selenium)", auto.get(i, "Pendiente")
            quien = "Selenium (npm test)" if i in auto else ""
            obt = "Ver reportes/reporte-regresion.html" if i in auto else ""
        elif i in MANUALES:
            res = MANUALES_RES.get(i)
            dec = "Regresión manual"
            est, obt, quien = (res["estado"], res["obtenido"], EJECUTOR) if res else ("Pendiente", "", "")
        else:
            dec, est, quien, obt = "No se ejecuta en V3", "N/A", "", "Riesgo bajo (ver 03-Seleccion...)"
        ws.append([i, t["desc"], t["hu"], t["tipo"], t["prioridad"], dec,
                   t["v1"], t["v2"], est, obt, quien])
    for c in CASOS:
        res = MANUALES_RES.get(c["id"])
        ws.append([c["id"], c["desc"], c["hu"], c["tipo"], c["prioridad"], "Nuevo V3 (manual)",
                   "N/A (nuevo)", "N/A (nuevo)",
                   res["estado"] if res else "Pendiente",
                   res["obtenido"] if res else "",
                   EJECUTOR if res else ""])
    ultima = ws.max_row
    for row in ws.iter_rows(min_row=2, max_row=ultima):
        for c in row:
            c.border = borde
            c.alignment = Alignment(wrap_text=True, vertical="top")
    for col, ancho in zip("ABCDEFGHIJK", (11, 48, 14, 13, 10, 26, 12, 12, 12, 34, 20)):
        ws.column_dimensions[col].width = ancho
    ws.freeze_panes = "B2"

    # Tabla de resumen con fórmulas (se actualiza sola al completar la columna Estado)
    f0 = ultima + 3
    ws.cell(row=f0, column=2, value="RESUMEN POR ENTREGA").font = Font(bold=True)
    for j, h in enumerate(["Entrega", "PASSED", "FAILED", "BLOCKED", "Pendiente", "% PASSED"]):
        c = ws.cell(row=f0 + 1, column=2 + j, value=h)
        c.font, c.fill = negrita, relleno
    for k, (nombre, col) in enumerate((("V1", "G"), ("V2", "H"), ("V3", "I"))):
        f = f0 + 2 + k
        rango = f"{col}2:{col}{ultima}"
        ws.cell(row=f, column=2, value=nombre)
        ws.cell(row=f, column=3, value=f'=COUNTIF({rango},"PASS")')
        ws.cell(row=f, column=4, value=f'=COUNTIF({rango},"FAIL")')
        ws.cell(row=f, column=5, value=f'=COUNTIF({rango},"BLOCKED")')
        ws.cell(row=f, column=6, value=f'=COUNTIF({rango},"Pendiente")')
        c = ws.cell(row=f, column=7, value=f"=IFERROR(C{f}/(C{f}+D{f}+E{f}),0)")
        c.number_format = "0.0%"

    grafico = BarChart()
    grafico.type = "col"
    grafico.grouping = "stacked"
    grafico.overlap = 100
    grafico.title = "Resultados por entrega (PASSED / FAILED / BLOCKED)"
    grafico.y_axis.title = "Casos de prueba"
    datos = Reference(ws, min_col=3, max_col=5, min_row=f0 + 1, max_row=f0 + 4)
    categorias = Reference(ws, min_col=2, min_row=f0 + 2, max_row=f0 + 4)
    grafico.add_data(datos, titles_from_data=True)
    grafico.set_categories(categorias)
    for serie, color in zip(grafico.series, ("2E7D32", "C62828", "9E9E9E")):  # PASSED, FAILED, BLOCKED
        serie.graphicalProperties.solidFill = color
        serie.graphicalProperties.line.solidFill = color
    grafico.height, grafico.width = 9, 16
    ws.add_chart(grafico, f"I{f0}")
    return ws


def generar_excel(planilla_v2, ruta_json):
    global AUTO_RES
    AUTO_RES = resultados_automatizados(ruta_json)
    wb = openpyxl.load_workbook(planilla_v2)

    # Casos de V1/V2 automatizados: se actualiza el campo "Automation Status"
    for nombre in AUTOMATIZADOS:
        if nombre not in wb.sheetnames:
            continue
        ws = wb[nombre]
        for row in ws.iter_rows():
            for c in row:
                if c.value == "Automation Status":
                    ws.cell(row=c.row, column=c.column + 1, value="Automated (Selenium)")

    # Casos de V1/V2 que se volvieron a ejecutar en V3: QA Tester's Log y una fila "Actual Result (V3)"
    for nombre in AUTOMATIZADOS + MANUALES:
        if nombre not in wb.sheetnames:
            continue
        ws = wb[nombre]
        if nombre in MANUALES:
            res = MANUALES_RES.get(nombre)
            if not res:
                continue
            estado, obtenido = res["estado"], f"Regresión manual en V3 ({EJECUTOR}): {res['obtenido']}"
        else:
            estado = AUTO_RES.get(nombre)
            if not estado:
                continue
            obtenido = ("Regresión automatizada en V3 (Selenium, npm test): " + estado +
                        ". Corrida oficial en la PC del equipo: 31 de 31 PASS.")
        ref = None
        for row in ws.iter_rows():
            for c in row:
                if c.value == "QA Tester’s Log" or c.value == "QA Tester's Log":
                    ws.cell(row=c.row, column=c.column + 1, value=estado)
                if isinstance(c.value, str) and c.value.startswith("Actual Result (V2)"):
                    ref = c.row
        if ref:
            nueva = ws.max_row + 1
            for col in range(1, 6):
                estilo(ws.cell(row=ref, column=col), ws.cell(row=nueva, column=col))
            ws.cell(row=nueva, column=1, value="Actual Result (V3)")
            ws.cell(row=nueva, column=2, value=obtenido).alignment = Alignment(wrap_text=True, vertical="top")
            ws.merge_cells(start_row=nueva, start_column=2, end_row=nueva, end_column=5)
            ws.row_dimensions[nueva].height = 60 if len(obtenido) > 110 else 30

    plantilla = wb["TC-07"]
    for caso in CASOS:
        hoja_caso(wb, plantilla, caso)
    for d in DEFECTOS:
        hoja_defecto(wb, wb["Defect Report - Template"], d)

    # Casos de V1/V2 con su estado (extraídos de "02 – Ejecución, Resumen y Defectos V2")
    with open(os.path.join(os.path.dirname(__file__), "tcs_v1_v2.json"), encoding="utf-8") as f:
        tcs_v2 = json.load(f)
    hoja_resumen(wb, tcs_v2, AUTO_RES)

    # Matias Sosa dejó la materia: sus celdas pasan a "Grupo 12"
    for hoja in wb.worksheets:
        for row in hoja.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.strip() in ("Matias Sosa", "Matías Sosa"):
                    c.value = "Grupo 12"
    destino = os.path.join(DOCS, "TPO - TC and Defect Template GRUPO12 - V3.xlsx")
    wb.save(destino)
    return destino


if __name__ == "__main__":
    generar_markdown()
    print(generar_excel(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None))
