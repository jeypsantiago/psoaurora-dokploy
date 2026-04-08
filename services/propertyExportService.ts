import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Asset,
  AssetCategory,
  InventoryCountLine,
  InventoryEvent,
  AuditLogEntry,
} from "../pages/property/propertyTypes";

/**
 * Export Asset Registry as PDF
 */
export function exportAssetRegistryPdf(
  assets: Asset[],
  categories: AssetCategory[],
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "legal",
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY & ASSET REGISTRY", 14, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Philippine Statistics Authority | Generated: ${new Date().toLocaleDateString()}`,
    14,
    21,
  );

  const tableData = assets.map((asset) => {
    const cat = categories.find((c) => c.id === asset.categoryId);
    return [
      asset.propertyNo,
      asset.description,
      asset.assetClass,
      cat?.name || "—",
      asset.serialNo || "—",
      asset.acquisitionDate,
      `₱${asset.cost.toLocaleString()}`,
      asset.location,
      asset.condition,
      asset.status,
    ];
  });

  autoTable(doc, {
    startY: 26,
    head: [
      [
        "Property No.",
        "Description",
        "Class",
        "Category",
        "Serial No.",
        "Acquired",
        "Cost",
        "Location",
        "Condition",
        "Status",
      ],
    ],
    body: tableData,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 98, 255], fontSize: 6, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save("PSA_Asset_Registry.pdf");
}

/**
 * Export Inventory Count Report as PDF
 */
export function exportInventoryCountPdf(
  event: InventoryEvent,
  countLines: InventoryCountLine[],
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    "REPORT ON THE PHYSICAL COUNT OF PROPERTY",
    doc.internal.pageSize.getWidth() / 2,
    15,
    { align: "center" },
  );
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `(As of ${event.asOfDate})`,
    doc.internal.pageSize.getWidth() / 2,
    20,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.text(`Entity: Philippine Statistics Authority`, 14, 30);
  doc.text(`Event: ${event.title}`, 14, 35);
  doc.text(`Status: ${event.status.toUpperCase()}`, 14, 40);

  const scanned = countLines.filter((l) => l.scanned);
  const discrepancies = countLines.filter((l) => l.discrepancyType);
  doc.text(
    `Total Items: ${countLines.length}  |  Scanned: ${scanned.length}  |  Discrepancies: ${discrepancies.length}`,
    14,
    45,
  );

  const tableData = countLines.map((line) => [
    line.propertyNo,
    line.assetDescription,
    line.expectedLocation,
    line.scanned ? "Yes" : "No",
    line.foundLocation || "—",
    line.foundCondition || "—",
    line.discrepancyType || "OK",
    line.discrepancyNotes || "",
  ]);

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "Property No.",
        "Description",
        "Expected Loc.",
        "Scanned",
        "Found Loc.",
        "Condition",
        "Status",
        "Notes",
      ],
    ],
    body: tableData,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 98, 255], fontSize: 6, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // Signature block
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const sigY = finalY + 20;
  doc.setFontSize(8);
  doc.text("Certified Correct:", 14, sigY);
  doc.line(14, sigY + 15, 90, sigY + 15);
  doc.setFontSize(7);
  doc.text("Inventory Committee Chair", 52, sigY + 20, { align: "center" });

  doc.text("Noted by:", 120, sigY);
  doc.line(120, sigY + 15, 196, sigY + 15);
  doc.text("Property/Supply Officer", 158, sigY + 20, { align: "center" });

  doc.save(`Inventory_Count_${event.title.replace(/\s/g, "_")}.pdf`);
}

/**
 * Export Audit Trail as PDF
 */
export function exportAuditTrailPdf(logs: AuditLogEntry[]): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "legal",
  });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY AUDIT TRAIL", 14, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Philippine Statistics Authority | Generated: ${new Date().toLocaleDateString()}`,
    14,
    21,
  );

  const tableData = logs.map((log) => [
    new Date(log.timestamp).toLocaleString(),
    log.userName,
    log.action,
    log.entityType,
    log.entityId,
    log.details,
  ]);

  autoTable(doc, {
    startY: 26,
    head: [
      ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details"],
    ],
    body: tableData,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 98, 255], fontSize: 6, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 5: { cellWidth: 60 } },
  });

  doc.save("PSA_Property_Audit_Trail.pdf");
}
