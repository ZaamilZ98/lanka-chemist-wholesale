import ExcelJS from "exceljs";

// Lanka Chemist brand colors
const BRAND_GREEN = "2E7D32";
const HEADER_BLUE = "1565C0";
const LOW_STOCK_RED = "FFCDD2";
const WARNING_YELLOW = "FFF9C4";
const SUCCESS_GREEN = "C8E6C9";
const LIGHT_GRAY = "F5F5F5";

// Currency format for Sri Lankan Rupees
export const CURRENCY_FORMAT = '"Rs "#,##0.00';
export const NUMBER_FORMAT = "#,##0";
export const PERCENT_FORMAT = "0.0%";
export const DATE_FORMAT = "YYYY-MM-DD";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export interface CreateWorkbookOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  title: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: T[];
  includeTitle?: boolean;
}

/**
 * Create a professionally styled Excel workbook with Lanka Chemist branding
 */
export async function createStyledWorkbook<T extends Record<string, unknown>>(
  options: CreateWorkbookOptions<T>
): Promise<ExcelJS.Workbook> {
  const { title, sheetName = "Report", columns, data, includeTitle = true } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lanka Chemist Wholesale";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  let startRow = 1;

  // Add title row if requested
  if (includeTitle) {
    sheet.mergeCells("A1", `${getColumnLetter(columns.length)}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: BRAND_GREEN } };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(1).height = 30;

    // Add generation date
    sheet.mergeCells("A2", `${getColumnLetter(columns.length)}2`);
    const dateCell = sheet.getCell("A2");
    dateCell.value = `Generated: ${new Date().toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`;
    dateCell.font = { size: 10, color: { argb: "666666" } };
    sheet.getRow(2).height = 20;

    // Empty row
    sheet.getRow(3).height = 10;
    startRow = 4;
  }

  // Set up columns
  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
    style: col.style,
  }));

  // Style header row
  const headerRow = sheet.getRow(startRow);
  headerRow.values = columns.map((c) => c.header);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_GREEN },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "CCCCCC" } },
      bottom: { style: "thin", color: { argb: "CCCCCC" } },
      left: { style: "thin", color: { argb: "CCCCCC" } },
      right: { style: "thin", color: { argb: "CCCCCC" } },
    };
  });
  headerRow.height = 25;

  // Add data rows
  data.forEach((row, index) => {
    const dataRow = sheet.getRow(startRow + 1 + index);
    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = row[col.key] as ExcelJS.CellValue;
      if (col.style) {
        Object.assign(cell, { style: col.style });
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "EEEEEE" } },
      };
    });

    // Alternate row colors
    if (index % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: LIGHT_GRAY },
        };
      });
    }
  });

  return workbook;
}

/**
 * Add a totals row to a worksheet
 */
export function addTotalsRow(
  sheet: ExcelJS.Worksheet,
  startDataRow: number,
  endDataRow: number,
  sumColumns: number[],
  labelColumn: number = 1,
  labelText: string = "TOTALS:"
): void {
  const totalsRow = sheet.getRow(endDataRow + 1);
  totalsRow.getCell(labelColumn).value = labelText;
  totalsRow.getCell(labelColumn).font = { bold: true };

  sumColumns.forEach((colIndex) => {
    const colLetter = getColumnLetter(colIndex);
    const cell = totalsRow.getCell(colIndex);
    cell.value = {
      formula: `SUM(${colLetter}${startDataRow}:${colLetter}${endDataRow})`,
    };
    cell.font = { bold: true };
    cell.numFmt = CURRENCY_FORMAT;
  });

  totalsRow.eachCell((cell) => {
    cell.border = {
      top: { style: "double", color: { argb: BRAND_GREEN } },
    };
  });
}

/**
 * Apply conditional formatting for low stock items
 */
export function highlightLowStock(
  row: ExcelJS.Row,
  _isLowStock: boolean
): void {
  if (_isLowStock) {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: LOW_STOCK_RED },
      };
    });
  }
}

/**
 * Apply status-based coloring
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    new: "BBDEFB", // Light blue
    confirmed: "C5CAE9", // Light indigo
    packing: WARNING_YELLOW,
    ready: "FFE0B2", // Light orange
    dispatched: "E1BEE7", // Light purple
    delivered: SUCCESS_GREEN,
    cancelled: LOW_STOCK_RED,
    pending: WARNING_YELLOW,
    paid: SUCCESS_GREEN,
  };
  return statusColors[status.toLowerCase()] || "FFFFFF";
}

/**
 * Get Excel column letter from index (1-based)
 */
export function getColumnLetter(colIndex: number): string {
  let result = "";
  let temp = colIndex;
  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    temp = Math.floor((temp - 1) / 26);
  }
  return result;
}

/**
 * Convert workbook to buffer for download
 */
export async function workbookToBuffer(
  workbook: ExcelJS.Workbook
): Promise<ArrayBuffer> {
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

/**
 * Create standard currency style
 */
export function currencyStyle(): Partial<ExcelJS.Style> {
  return {
    numFmt: CURRENCY_FORMAT,
    alignment: { horizontal: "right" },
  };
}

/**
 * Create standard date style
 */
export function dateStyle(): Partial<ExcelJS.Style> {
  return {
    numFmt: DATE_FORMAT,
    alignment: { horizontal: "center" },
  };
}

/**
 * Create standard number style
 */
export function numberStyle(): Partial<ExcelJS.Style> {
  return {
    numFmt: NUMBER_FORMAT,
    alignment: { horizontal: "right" },
  };
}
