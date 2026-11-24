export const BIRTHDAYS_EXCEL_ERROR =
  "File Must be an Excel file in the format: Tag, Noemnaam, Van, Ouderdom, Verjaardag, Selfoon";

const HEADER_ALIASES = [
  ["tag"],
  ["noemnaam"],
  ["van"],
  ["ouderdom"],
  ["verjaardag", "verjaardsdag"],
  ["selfoon"],
];

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isExcelFile(file) {
  const name = file.name?.toLowerCase() ?? "";
  const type = file.type?.toLowerCase() ?? "";

  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xlsm") ||
    type.includes("spreadsheetml") ||
    type.includes("ms-excel")
  );
}

function cellToString(cellValue) {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }

  if (typeof cellValue === "object") {
    if (cellValue.text) {
      return String(cellValue.text);
    }

    if (cellValue.result !== undefined && cellValue.result !== null) {
      return String(cellValue.result);
    }

    if (cellValue.richText) {
      return cellValue.richText.map((part) => part.text).join("");
    }
  }

  return String(cellValue);
}

function isValidCalendarDate(year, month, day) {
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function toIsoDateWithCurrentYear(day, month) {
  const year = new Date().getFullYear();

  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseVerjaarsdagWithCurrentYear(cellValue) {
  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return "";
  }

  if (cellValue instanceof Date) {
    const iso = toIsoDateWithCurrentYear(
      cellValue.getDate(),
      cellValue.getMonth() + 1
    );

    if (!iso) {
      throw new Error(BIRTHDAYS_EXCEL_ERROR);
    }

    return iso;
  }

  const text = cellToString(cellValue).trim();

  if (!text) {
    return "";
  }

  const match = text.match(/^(\d{1,2})\/(\d{1,2})$/);

  if (!match) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const iso = toIsoDateWithCurrentYear(day, month);

  if (!iso) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  return iso;
}

function cellToTag(cellValue) {
  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return "";
  }

  if (typeof cellValue === "boolean") {
    return cellValue ? "true" : "false";
  }

  return cellToString(cellValue);
}

function rowHasData(values) {
  return values.some((value) => String(value ?? "").trim() !== "");
}

export async function parseBirthdaysExcelFile(file) {
  if (!isExcelFile(file)) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  const headerRow = worksheet.getRow(1);
  const headerValues = HEADER_ALIASES.map((_, index) =>
    normalizeHeader(headerRow.getCell(index + 1).value)
  );

  const headersValid = HEADER_ALIASES.every((aliases, index) =>
    aliases.includes(headerValues[index])
  );

  if (!headersValid) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const tag = cellToTag(row.getCell(1).value);
    const noemnaam = cellToString(row.getCell(2).value).trim();
    const van = cellToString(row.getCell(3).value).trim();
    const ouderdom = cellToString(row.getCell(4).value).trim();
    const verjaardag = parseVerjaarsdagWithCurrentYear(row.getCell(5).value);
    const selfoon = cellToString(row.getCell(6).value).trim();

    const values = [tag, noemnaam, van, ouderdom, verjaardag, selfoon];

    if (!rowHasData(values)) {
      return;
    }

    rows.push({
      tag,
      noemnaam,
      van,
      ouderdom,
      verjaardag,
      selfoon,
    });
  });

  if (!rows.length) {
    throw new Error(BIRTHDAYS_EXCEL_ERROR);
  }

  return rows;
}