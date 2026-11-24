import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "output");
const outFile = path.join(outDir, "Verjaarsdae-import.pptx");

fs.mkdirSync(outDir, { recursive: true });

const pptx = new pptxgen();
pptx.author = "NGK Roodekrans";
pptx.title = "Verjaarsdae Excel import";
pptx.layout = "LAYOUT_16x9";

const titleSlide = pptx.addSlide();
titleSlide.addText("Verjaarsdae", {
  x: 0.5,
  y: 1.4,
  w: "90%",
  h: 1.2,
  fontSize: 40,
  bold: true,
  color: "1a365d",
  align: "center",
});
titleSlide.addText("Excel import na die databasis", {
  x: 0.5,
  y: 2.6,
  w: "90%",
  h: 0.8,
  fontSize: 22,
  color: "4a5568",
  align: "center",
});

const formatSlide = pptx.addSlide();
formatSlide.addText("Vereiste Excel-formaat", {
  x: 0.5,
  y: 0.4,
  w: "90%",
  fontSize: 28,
  bold: true,
  color: "1a365d",
});
formatSlide.addText(
  [
    { text: "Ry 1 moet hierdie kolomkoppe hê (presies):", options: { breakLine: true } },
    { text: "Tag, Noemnaam, Van, Ouderdom, Verjaardag, Selfoon", options: { bold: true, breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "Verjaardag: MM/dd (bv. 03/15 vir 15 Maart)", options: { breakLine: true } },
    { text: "Die app voeg die huidige jaar by vir volle datum.", options: { breakLine: true } },
  ],
  { x: 0.6, y: 1.2, w: 8.8, h: 4, fontSize: 18, color: "2d3748", valign: "top" }
);

const flowSlide = pptx.addSlide();
flowSlide.addText("Hoe dit werk", {
  x: 0.5,
  y: 0.4,
  w: "90%",
  fontSize: 28,
  bold: true,
  color: "1a365d",
});
flowSlide.addText(
  [
    "1. Teken Excel-lêer op /verjaarsdae (admin)\n",
    "2. Lêer word gevalideer teen kolomkoppe\n",
    "3. API roep public.pu_birthdays_import(p_rows) aan\n",
    "4. Tabel app_private.birthdays word leeggemaak en herlaai\n",
  ].join(""),
  { x: 0.6, y: 1.2, w: 8.8, h: 4.5, fontSize: 20, color: "2d3748", valign: "top" }
);

const dbSlide = pptx.addSlide();
dbSlide.addText("Databasis (app_private.birthdays)", {
  x: 0.5,
  y: 0.4,
  w: "90%",
  fontSize: 26,
  bold: true,
  color: "1a365d",
});
const rows = [
  ["Kolom", "Tipe"],
  ["tag", "boolean"],
  ["noemnaam, van, selfoon", "text"],
  ["ouderdom", "integer"],
  ["verjaardag", "date"],
];
dbSlide.addTable(rows, {
  x: 0.8,
  y: 1.3,
  w: 8.4,
  colW: [3.2, 5.2],
  fontSize: 16,
  border: { type: "solid", color: "cbd5e0", pt: 1 },
  fill: { color: "f7fafc" },
});

await pptx.writeFile({ fileName: outFile });
console.log(`Wrote ${outFile}`);