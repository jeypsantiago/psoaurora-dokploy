import type React from "react";
import { jsPDF } from "jspdf";
import {
  Asset,
  CustodyRecord,
  AssetCategory,
} from "../../pages/property/propertyTypes";

interface ICSDocumentProps {
  asset: Asset;
  custodyRecord: CustodyRecord;
  category?: AssetCategory;
}

/**
 * Generate ICS (Inventory Custodian Slip) document as PDF
 * Following COA Circular 2022-004 format for semi-expendable property
 */
export function generateICSPdf(
  asset: Asset,
  custody: CustodyRecord,
  _category?: AssetCategory,
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = pageWidth - 20;
  const contentWidth = marginRight - marginLeft;

  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INVENTORY CUSTODIAN SLIP", pageWidth / 2, 25, { align: "center" });

  // Header line
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("(Per COA Circular 2022-004)", pageWidth / 2, 30, {
    align: "center",
  });

  // Entity and Fund Cluster
  doc.setFontSize(9);
  const y1 = 40;
  doc.text("Entity Name:", marginLeft, y1);
  doc.setFont("helvetica", "bold");
  doc.text("Philippine Statistics Authority", marginLeft + 28, y1);
  doc.setFont("helvetica", "normal");
  doc.text("Fund Cluster:", marginLeft + 110, y1);
  doc.setFont("helvetica", "bold");
  doc.text("01 — Regular Agency Fund", marginLeft + 138, y1);

  // ICS No.
  const y2 = y1 + 8;
  doc.setFont("helvetica", "normal");
  doc.text("ICS No.:", marginLeft, y2);
  doc.setFont("helvetica", "bold");
  doc.text(custody.documentNo, marginLeft + 20, y2);
  doc.setFont("helvetica", "normal");
  doc.text("Date:", marginLeft + 110, y2);
  doc.setFont("helvetica", "bold");
  doc.text(custody.dateIssued, marginLeft + 122, y2);

  // Table Header
  const tableY = y2 + 10;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  const colWidths = [15, 8, 50, 25, 25, 25, 25];
  const headers = [
    "Qty",
    "Unit",
    "Description",
    "Property No.",
    "Date Acquired",
    "Amount",
    "Condition",
  ];

  let xPos = marginLeft;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  // Draw header row
  headers.forEach((header, i) => {
    doc.rect(xPos, tableY, colWidths[i], 8);
    doc.text(header, xPos + colWidths[i] / 2, tableY + 5.5, {
      align: "center",
    });
    xPos += colWidths[i];
  });

  // Data row
  const rowY = tableY + 8;
  xPos = marginLeft;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const rowData = [
    "1",
    "pc",
    asset.description + (asset.serialNo ? `\nS/N: ${asset.serialNo}` : ""),
    asset.propertyNo,
    asset.acquisitionDate,
    `₱${asset.cost.toLocaleString()}`,
    asset.condition,
  ];

  rowData.forEach((data, i) => {
    doc.rect(xPos, rowY, colWidths[i], 12);
    const lines = data.split("\n");
    lines.forEach((line, li) => {
      doc.text(line, xPos + colWidths[i] / 2, rowY + 4.5 + li * 3.5, {
        align: "center",
      });
    });
    xPos += colWidths[i];
  });

  // Signatures
  const sigY = rowY + 30;
  const halfWidth = contentWidth / 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Received from
  doc.text("Received from:", marginLeft, sigY);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, sigY + 18, marginLeft + halfWidth - 10, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Property/Supply Officer",
    marginLeft + (halfWidth - 10) / 2,
    sigY + 23,
    { align: "center" },
  );

  // Received by
  doc.setFont("helvetica", "normal");
  doc.text("Received by:", marginLeft + halfWidth, sigY);
  doc.line(marginLeft + halfWidth, sigY + 18, marginRight, sigY + 18);
  doc.setFont("helvetica", "bold");
  doc.text(
    custody.custodianName,
    marginLeft + halfWidth + halfWidth / 2,
    sigY + 14,
    { align: "center" },
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "End User / Accountable Officer",
    marginLeft + halfWidth + halfWidth / 2,
    sigY + 23,
    { align: "center" },
  );

  // Date acknowledged
  const ackY = sigY + 30;
  doc.setFontSize(7);
  doc.text(
    `Date Acknowledged: ${custody.acknowledgedAt ? new Date(custody.acknowledgedAt).toLocaleDateString() : "_______________"}`,
    marginLeft,
    ackY,
  );

  // Save
  doc.save(`ICS_${custody.documentNo.replace(/\s/g, "_")}.pdf`);
}

/**
 * React component wrapper — just a trigger button placeholder
 * Actual generation is done via generateICSPdf function
 */
export const ICSDocument: React.FC<ICSDocumentProps> = ({
  asset: _asset,
  custodyRecord: _custodyRecord,
  category: _category,
}) => {
  return null; // This is a service, not a visual component
};
