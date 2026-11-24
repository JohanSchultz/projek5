import os from "node:os";
import path from "node:path";
import PptxAutomizer from "pptx-automizer";

const Automizer = PptxAutomizer.default ?? PptxAutomizer;

const TEMPLATE_ALIAS = "verjaarsdag";

const NAVY = "3D4F5F";
const BODY_COLOR = "2D3748";
const FONT = "Calibri";

/** 16:9 slide size (inches), matching the template layout. */
const SLIDE_WIDTH = 10;
/** Match common 16:9 deck height (13.33×7.5 in) so vertical positions use the full slide. */
const SLIDE_HEIGHT = 7.5;
const CONTENT_WIDTH = SLIDE_WIDTH * 0.7;
const CONTENT_LEFT = (SLIDE_WIDTH - CONTENT_WIDTH) / 2;

const LIST_TOP = 0.04;
const LIST_BOTTOM = SLIDE_HEIGHT - 0.04;
const USABLE_LIST_HEIGHT = LIST_BOTTOM - LIST_TOP;

const ROWS_PER_SLIDE = 15;
const ROW_PITCH = USABLE_LIST_HEIGHT / ROWS_PER_SLIDE;
/** Text box uses 1/8 of row slot (4× airier than the previous 50% setting). */
const ROW_TEXT_FRACTION = 0.5 / 4;
const ROW_HEIGHT = Math.max(ROW_PITCH * ROW_TEXT_FRACTION, 0.2);
const ROW_Y_INSET = (ROW_PITCH - ROW_HEIGHT) / 2;

const NAME_FONT = 32;
const AGE_FONT = 32;
const DAY_FONT = 32;
const DAY_SUFFIX_FONT = 22;

/** Calibri avg glyph width ≈ 52% of em; 1 em = font pt ÷ 72 in. */
const FOUR_CHAR_WIDTH = (4 * NAME_FONT * 0.52) / 72;
const TWO_CHAR_WIDTH = FOUR_CHAR_WIDTH / 2;
const NAAM_SHIFT_LEFT = FOUR_CHAR_WIDTH;
const OUDERDOM_VERJAARDAG_SHIFT_RIGHT = FOUR_CHAR_WIDTH * 2;

const REMAINING_COL_SHARE = 0.25;
const AGE_COL_SHARE_BASE =
  REMAINING_COL_SHARE * (0.24 / (0.24 + 0.26)) * 2;
const DAY_COL_SHARE_BASE =
  REMAINING_COL_SHARE * (0.26 / (0.24 + 0.26)) * 2;
const NAME_COL_SHARE_BASE = 1 - AGE_COL_SHARE_BASE - DAY_COL_SHARE_BASE;

const NAME_COL_SHARE_TARGET = NAME_COL_SHARE_BASE * 1.7;

const OTHER_COL_SCALE =
  (1 - NAME_COL_SHARE_TARGET) / (AGE_COL_SHARE_BASE + DAY_COL_SHARE_BASE);
let AGE_COL_SHARE = AGE_COL_SHARE_BASE * OTHER_COL_SCALE * 3;
let DAY_COL_SHARE = DAY_COL_SHARE_BASE * OTHER_COL_SCALE * 3;
let NAME_COL_SHARE = (1 - AGE_COL_SHARE - DAY_COL_SHARE) * 1.5;

const REBALANCE_OTHER_COLS =
  (1 - NAME_COL_SHARE) / (AGE_COL_SHARE + DAY_COL_SHARE);
AGE_COL_SHARE *= REBALANCE_OTHER_COLS;
DAY_COL_SHARE *= REBALANCE_OTHER_COLS;

AGE_COL_SHARE *= 3;
NAME_COL_SHARE = 1 - AGE_COL_SHARE - DAY_COL_SHARE;

DAY_COL_SHARE *= 3;
NAME_COL_SHARE = 1 - AGE_COL_SHARE - DAY_COL_SHARE;

NAME_COL_SHARE *= 1.3;
const REBALANCE_AFTER_NAAM_WIDEN =
  (1 - NAME_COL_SHARE) / (AGE_COL_SHARE + DAY_COL_SHARE);
AGE_COL_SHARE *= REBALANCE_AFTER_NAAM_WIDEN;
DAY_COL_SHARE *= REBALANCE_AFTER_NAAM_WIDEN;

NAME_COL_SHARE *= 1.3;
const REBALANCE_AFTER_NAAM_WIDEN_AGAIN =
  (1 - NAME_COL_SHARE) / (AGE_COL_SHARE + DAY_COL_SHARE);
AGE_COL_SHARE *= REBALANCE_AFTER_NAAM_WIDEN_AGAIN;
DAY_COL_SHARE *= REBALANCE_AFTER_NAAM_WIDEN_AGAIN;

const NAME_X = Math.max(0.05, CONTENT_LEFT - NAAM_SHIFT_LEFT);
const NAME_W = CONTENT_WIDTH * NAME_COL_SHARE;

const AGE_W_BASE = CONTENT_WIDTH * AGE_COL_SHARE;
const AGE_X_BASE = CONTENT_LEFT + NAME_W + OUDERDOM_VERJAARDAG_SHIFT_RIGHT;
const AGE_RIGHT = AGE_X_BASE + AGE_W_BASE;
const AGE_W = AGE_W_BASE * 3;
const AGE_X = AGE_RIGHT - AGE_W - TWO_CHAR_WIDTH;

const DAY_X = AGE_RIGHT - TWO_CHAR_WIDTH;
const DAY_W = CONTENT_WIDTH * DAY_COL_SHARE * 1.5;

function getRowField(row, fieldName) {
  const key = Object.keys(row ?? {}).find(
    (column) => column.toLowerCase() === fieldName.toLowerCase()
  );

  return key ? row[key] : "";
}

function parseVerjaardag(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const datePart = String(value).split("T")[0];
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(
    `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { date, day: date.getDate() };
}

function afrikaansDayOrdinalSuffix(day) {
  const mod10 = day % 10;
  const mod100 = day % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "ste";
  }

  if (mod10 === 8 && mod100 !== 18) {
    return "ste";
  }

  if (mod10 === 9 && mod100 !== 19) {
    return "ste";
  }

  return "de";
}

function buildDayOrdinalRichText(day) {
  const suffix = afrikaansDayOrdinalSuffix(day);

  return [
    {
      text: String(day),
      options: {
        bold: true,
        color: NAVY,
        fontSize: DAY_FONT,
        fontFace: FONT,
      },
    },
    {
      text: suffix,
      options: {
        bold: true,
        color: NAVY,
        fontSize: DAY_SUFFIX_FONT,
        superscript: true,
        fontFace: FONT,
      },
    },
  ];
}

function parseOuderdom(ouderdom) {
  if (ouderdom === null || ouderdom === undefined || ouderdom === "") {
    return null;
  }

  const age = Math.round(Number(String(ouderdom).trim()));

  if (Number.isNaN(age)) {
    return null;
  }

  return age;
}

/** Age shown with stars (handles “age turning” before the birthday). */
function resolveCelebrationAge(ouderdom) {
  const base = parseOuderdom(ouderdom);

  if (base === null) {
    return null;
  }

  const turning = base + 1;

  if (base === 16 || base === 18) {
    return base;
  }

  if (turning === 16 || turning === 18) {
    return turning;
  }

  if (base >= 70) {
    return base;
  }

  if (turning >= 70) {
    return turning;
  }

  return null;
}

function sortRows(rows) {
  return [...rows].sort((left, right) => {
    const leftDate = parseVerjaardag(getRowField(left, "verjaardag"));
    const rightDate = parseVerjaardag(getRowField(right, "verjaardag"));

    if (!leftDate && !rightDate) {
      return String(getRowField(left, "naam")).localeCompare(
        String(getRowField(right, "naam")),
        "af"
      );
    }

    if (!leftDate) {
      return 1;
    }

    if (!rightDate) {
      return -1;
    }

    return leftDate.date.getTime() - rightDate.date.getTime();
  });
}

function overlayBirthdayRows(pptxSlide, rows) {
  rows.forEach((row, index) => {
    const y = LIST_TOP + index * ROW_PITCH + ROW_Y_INSET;
    const naam = String(getRowField(row, "naam") ?? "").trim();
    const ouderdom = getRowField(row, "ouderdom");
    const parsed = parseVerjaardag(getRowField(row, "verjaardag"));
    const celebrationAge = resolveCelebrationAge(ouderdom);

    pptxSlide.addText(naam, {
      x: NAME_X,
      y,
      w: NAME_W,
      h: ROW_HEIGHT,
      fontSize: NAME_FONT,
      bold: celebrationAge !== null,
      color: BODY_COLOR,
      fontFace: FONT,
      valign: "middle",
    });

    if (celebrationAge !== null) {
      pptxSlide.addText(`☆${celebrationAge}☆`, {
        x: AGE_X,
        y,
        w: AGE_W,
        h: ROW_HEIGHT,
        fontSize: AGE_FONT,
        color: BODY_COLOR,
        align: "center",
        valign: "middle",
        fontFace: FONT,
      });
    }

    if (parsed) {
      pptxSlide.addText(buildDayOrdinalRichText(parsed.day), {
        x: DAY_X,
        y,
        w: DAY_W,
        h: ROW_HEIGHT,
        valign: "middle",
        fontFace: FONT,
      });
    }
  });
}

function addEmptyMessageSlide(pres) {
  pres.addSlide(TEMPLATE_ALIAS, 1, (slide) => {
    slide.generate((pptxSlide) => {
      pptxSlide.addText("Geen verjaarsdae beskikbaar", {
        x: 0.8,
        y: 2.4,
        w: 5,
        h: 0.6,
        fontSize: 16,
        color: NAVY,
        fontFace: FONT,
      });
    });
  });
}

export async function buildVerjaarsdaePowerpoint(rows, templateBuffer) {
  if (!templateBuffer?.length) {
    throw new Error("Verjaarsdag template is missing or empty.");
  }

  const workDir = path.join(os.tmpdir(), "verjaarsdae-pptx");

  const automizer = new Automizer({
    templateDir: workDir,
    outputDir: workDir,
    removeExistingSlides: true,
    compression: 6,
  });

  const sortedRows = sortRows(rows ?? []);

  automizer.loadRoot(templateBuffer).load(templateBuffer, TEMPLATE_ALIAS);
  const pres = automizer;

  if (!sortedRows.length) {
    addEmptyMessageSlide(pres);
  } else {
    for (let offset = 0; offset < sortedRows.length; offset += ROWS_PER_SLIDE) {
      const chunk = sortedRows.slice(offset, offset + ROWS_PER_SLIDE);

      pres.addSlide(TEMPLATE_ALIAS, 1, (slide) => {
        slide.generate((pptxSlide) => {
          overlayBirthdayRows(pptxSlide, chunk);
        });
      });
    }
  }

  const zip = await pres.getJSZip();
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}