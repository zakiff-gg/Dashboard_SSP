import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toShortLabel } from "./dateRange.js";

function cellText(cell) {
  if (!cell || cell.type === "empty") return "";
  if (cell.type === "half") return "1/2";
  // full day
  return cell.overtime > 0 ? `v${cell.overtime}` : "v";
}

function buildHeaderAndBody(dates, rows) {
  const header = ["No", "Nama", "Jabatan", ...dates.map(toShortLabel), "Total Hari", "Jam Lembur"];
  const body = rows.map((r) => [
    r.no,
    r.nama,
    r.jabatan || "",
    ...dates.map((d) => cellText(r.cells[d])),
    r.totalHari,
    r.totalLembur || "",
  ]);
  return { header, body };
}

export function exportRekapExcel({ dates, rows, tanggalMulai, tanggalSelesai }) {
  const { header, body } = buildHeaderAndBody(dates, rows);
  const sheetData = [
    [`Rekap Absensi ${toShortLabel(tanggalMulai)} - ${toShortLabel(tanggalSelesai)}`],
    [],
    header,
    ...body,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 4 },
    { wch: 22 },
    { wch: 14 },
    ...dates.map(() => ({ wch: 7 })),
    { wch: 10 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
  XLSX.writeFile(wb, `Rekap_Absensi_${tanggalMulai}_sd_${tanggalSelesai}.xlsx`);
}

export function exportRekapPdf({ dates, rows, tanggalMulai, tanggalSelesai }) {
  const { header, body } = buildHeaderAndBody(dates, rows);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(13);
  doc.text(`Rekap Absensi ${toShortLabel(tanggalMulai)} - ${toShortLabel(tanggalSelesai)}`, 30, 28);

  autoTable(doc, {
    head: [header],
    body,
    startY: 40,
    styles: { fontSize: 7, cellPadding: 3, halign: "center" },
    headStyles: { fillColor: [47, 111, 235], textColor: 255, halign: "center" },
    columnStyles: {
      1: { halign: "left" },
      2: { halign: "left" },
    },
    margin: { left: 20, right: 20 },
  });

  doc.save(`Rekap_Absensi_${tanggalMulai}_sd_${tanggalSelesai}.pdf`);
}
