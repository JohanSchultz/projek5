import {
  formatSummaryCellValue,
  getSummaryColumns,
} from "./summary-grid";

const APTOS_FONT = "Aptos";
const MERGE_END_COLUMN = "G";
const TABLE_START_ROW = 7;

const gridBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

function getRowField(row, fieldName) {
  const key = Object.keys(row).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : undefined;
}

function applyTableCellStyle(cell, { bold = false, yellowBackground = false } = {}) {
  cell.font = {
    name: APTOS_FONT,
    size: 11,
    bold,
  };
  cell.border = gridBorder;
  cell.alignment = { vertical: "middle" };

  if (yellowBackground) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    };
  }
}

export async function exportVoteSummaryToExcel({
  reportRows,
  buildingName,
  meetingLabel,
  selectedMeetingId,
}) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Vote Summary");
  const columns = getSummaryColumns(reportRows);

  worksheet.mergeCells(`A1:${MERGE_END_COLUMN}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Voting Result Summary";
  titleCell.font = { name: APTOS_FONT, size: 18 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.getRow(2).height = 57;

  worksheet.mergeCells(`A3:${MERGE_END_COLUMN}3`);
  const buildingCell = worksheet.getCell("A3");
  buildingCell.value = `Building:  ${buildingName}`;
  buildingCell.font = { name: APTOS_FONT, size: 15 };
  buildingCell.alignment = { vertical: "middle" };

  worksheet.mergeCells(`A5:${MERGE_END_COLUMN}5`);
  const meetingCell = worksheet.getCell("A5");
  meetingCell.value = `Meeting:  ${meetingLabel}`;
  meetingCell.font = { name: APTOS_FONT, size: 15 };
  meetingCell.alignment = { vertical: "middle" };

  const headerRow = worksheet.getRow(TABLE_START_ROW);
  columns.forEach((column, columnIndex) => {
    const cell = headerRow.getCell(columnIndex + 1);
    cell.value = column.label;
    applyTableCellStyle(cell, { bold: true, yellowBackground: true });
  });

  reportRows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(TABLE_START_ROW + 1 + rowIndex);

    columns.forEach((column, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.value = formatSummaryCellValue(
        column.key,
        getRowField(row, column.key)
      );
      applyTableCellStyle(cell);
    });
  });

  columns.forEach((column, columnIndex) => {
    const columnLetter = String.fromCharCode("A".charCodeAt(0) + columnIndex);
    const lengths = [
      column.label.length,
      ...reportRows.map((row) =>
        String(
          formatSummaryCellValue(column.key, getRowField(row, column.key))
        ).length
      ),
    ];
    const width = Math.min(Math.max(...lengths, 10) + 2, 40);
    worksheet.getColumn(columnLetter).width =
      columnLetter === "A" ? width * 2 : width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vote-summary-meeting-${selectedMeetingId}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
