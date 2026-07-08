// Exportación del reporte a .xlsx con el mismo layout de la propuesta de
// Cecilia: hoja "Reporte General" (una fila por respuesta) + hoja
// "Estadísticas" (conteos por calificación). Usa exceljs (import dinámico
// para no cargar ~1 MB en el bundle de la encuesta pública).
import {
  LEVELS,
  REPORT_AREAS,
  IMPORTANCIA,
  factorCounts,
  importanceCounts,
  combinedComments,
  displayName,
} from './report.js'

const INK = 'FF1E293B'
const HEADER_FILL = 'FFE2E8F0'
const GROUP_FILLS = {
  jefatura: 'FFDBEAFE',
  companeros: 'FFDCFCE7',
  seguridad: 'FFFEF3C7',
  instalaciones: 'FFFDE8E7',
}

const thin = { style: 'thin', color: { argb: 'FFCBD5E1' } }
const BORDER = { top: thin, left: thin, bottom: thin, right: thin }

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function headerCell(cell, text, fillArgb = HEADER_FILL) {
  cell.value = text
  cell.font = { bold: true, size: 9, color: { argb: INK } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.fill = fill(fillArgb)
  cell.border = BORDER
}

// Hoja 1: "Reporte General" — encabezado ESCALAS + tabla con headers
// agrupados (filas 3-4) y una fila por respuesta desde la fila 5.
function buildGeneralSheet(wb, rows) {
  const ws = wb.addWorksheet('Reporte General', {
    views: [{ state: 'frozen', ySplit: 4 }],
  })

  // Fila 1: leyenda de escalas.
  headerCell(ws.getCell('B1'), 'ESCALAS')
  LEVELS.forEach((lv, i) => {
    const cell = ws.getCell(1, 3 + i)
    headerCell(cell, `${lv.value} ${lv.label.toUpperCase()}`, `FF${lv.pale}`)
  })

  // Filas 3-4: headers agrupados (merges como en la propuesta).
  ws.mergeCells('A3:A4')
  headerCell(ws.getCell('A3'), 'FECHA RECIBIDA')
  ws.mergeCells('B3:B4')
  headerCell(ws.getCell('B3'), 'NOMBRE')

  let col = 3
  const ratingCols = [] // [{col, key}] para pintar las celdas de datos
  for (const area of REPORT_AREAS) {
    const span = area.items.length
    const groupFill = GROUP_FILLS[area.key]
    if (span > 1) {
      ws.mergeCells(3, col, 3, col + span - 1)
      headerCell(ws.getCell(3, col), area.label.toUpperCase(), groupFill)
      area.items.forEach(([key, label], i) => {
        headerCell(ws.getCell(4, col + i), label.toUpperCase(), groupFill)
        ratingCols.push({ col: col + i, key })
      })
    } else {
      ws.mergeCells(3, col, 4, col)
      headerCell(ws.getCell(3, col), area.label.toUpperCase(), groupFill)
      ratingCols.push({ col, key: area.items[0][0] })
    }
    col += span
  }

  const impStart = col
  ws.mergeCells(3, impStart, 3, impStart + IMPORTANCIA.length - 1)
  headerCell(ws.getCell(3, impStart), 'LO MÁS IMPORTANTE PARA MI ES')
  IMPORTANCIA.forEach(([, label], i) => {
    headerCell(ws.getCell(4, impStart + i), label.toUpperCase())
  })
  col += IMPORTANCIA.length

  const commentsCol = col
  ws.mergeCells(3, commentsCol, 4, commentsCol)
  headerCell(ws.getCell(3, commentsCol), 'COMENTARIOS ADICIONALES')
  const respCol = col + 1
  ws.mergeCells(3, respCol, 4, respCol)
  headerCell(
    ws.getCell(3, respCol),
    'ÁREA Y/O PERSONA RESPONSABLE DE GENERAR PROPUESTA DE MEJORA'
  )

  // Anchos de columna.
  ws.getColumn(1).width = 13
  ws.getColumn(2).width = 24
  for (const { col: c } of ratingCols) ws.getColumn(c).width = 8
  for (let i = 0; i < IMPORTANCIA.length; i++) ws.getColumn(impStart + i).width = 7
  ws.getColumn(commentsCol).width = 70
  ws.getColumn(respCol).width = 30

  // Filas de datos.
  let rowIdx = 5
  for (const r of rows) {
    const row = ws.getRow(rowIdx)
    const dateCell = row.getCell(1)
    dateCell.value = new Date(r.submitted_at)
    dateCell.numFmt = 'yyyy-mm-dd'
    row.getCell(2).value = displayName(r)

    for (const { col: c, key } of ratingCols) {
      const cell = row.getCell(c)
      const v = r[key]
      if (v === 0) cell.value = 'N/A'
      else if (v != null) {
        cell.value = v
        cell.fill = fill(`FF${LEVELS[v - 1].pale}`)
      }
      cell.alignment = { horizontal: 'center' }
    }

    IMPORTANCIA.forEach(([key], i) => {
      const cell = row.getCell(impStart + i)
      if ((r.importancia_top || []).includes(key)) {
        cell.value = 'X'
        cell.font = { bold: true, color: { argb: INK } }
      }
      cell.alignment = { horizontal: 'center' }
    })

    const comments = combinedComments(r)
    const cCell = row.getCell(commentsCol)
    cCell.value = comments || 'Sin comentarios'
    cCell.alignment = { wrapText: true, vertical: 'top' }

    const rCell = row.getCell(respCol)
    rCell.value = r.responsable || (comments ? '' : 'N/A')
    rCell.alignment = { wrapText: true, vertical: 'top' }

    for (let c = 1; c <= respCol; c++) row.getCell(c).border = BORDER
    rowIdx += 1
  }

  return ws
}

// Hoja 2: "Estadísticas" — un bloque de conteos por área + bloque de
// "Lo más importante" (equivalente a la hoja Stats de la propuesta).
function buildStatsSheet(wb, rows) {
  const ws = wb.addWorksheet('Estadísticas')
  ws.getColumn(1).width = 18
  for (let c = 2; c <= 7; c++) ws.getColumn(c).width = 11

  let rowIdx = 1
  for (const area of REPORT_AREAS) {
    const head = ws.getRow(rowIdx)
    headerCell(head.getCell(1), area.label.toUpperCase(), GROUP_FILLS[area.key])
    LEVELS.forEach((lv, i) => headerCell(head.getCell(2 + i), lv.label.toUpperCase(), `FF${lv.pale}`))
    headerCell(head.getCell(7), 'N/A')
    rowIdx += 1

    for (const [key, label] of area.items) {
      const { counts, na } = factorCounts(rows, key)
      const row = ws.getRow(rowIdx)
      row.getCell(1).value = label.toUpperCase()
      row.getCell(1).font = { size: 9 }
      counts.forEach((c, i) => {
        row.getCell(2 + i).value = c
        row.getCell(2 + i).alignment = { horizontal: 'center' }
      })
      row.getCell(7).value = na
      row.getCell(7).alignment = { horizontal: 'center' }
      for (let c = 1; c <= 7; c++) row.getCell(c).border = BORDER
      rowIdx += 1
    }
    rowIdx += 1 // fila en blanco entre bloques
  }

  // Bloque "Lo más importante para mí es".
  ws.mergeCells(rowIdx, 1, rowIdx, IMPORTANCIA.length)
  headerCell(ws.getCell(rowIdx, 1), 'LO MÁS IMPORTANTE PARA MI ES')
  rowIdx += 1
  const imp = importanceCounts(rows)
  const headRow = ws.getRow(rowIdx)
  const valRow = ws.getRow(rowIdx + 1)
  IMPORTANCIA.forEach(([key, label], i) => {
    headerCell(headRow.getCell(1 + i), label.toUpperCase())
    valRow.getCell(1 + i).value = imp[key]
    valRow.getCell(1 + i).alignment = { horizontal: 'center' }
    valRow.getCell(1 + i).border = BORDER
  })

  return ws
}

// Arma el workbook completo (separado de la descarga para poder probarlo
// fuera del navegador).
export async function buildWorkbook(rows) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Tu Voz SEGA'
  wb.created = new Date()
  buildGeneralSheet(wb, rows)
  buildStatsSheet(wb, rows)
  return wb
}

// Genera el .xlsx y dispara la descarga en el navegador.
export async function exportReportXlsx(rows, { from = '', to = '' } = {}) {
  const wb = await buildWorkbook(rows)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const stamp = new Date().toISOString().slice(0, 10)
  const range = from || to ? ` ${from || 'inicio'} a ${to || stamp}` : ` ${stamp}`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Reporte general Tu Voz SEGA${range}.xlsx`
  a.click()
  URL.revokeObjectURL(a.href)
}
