import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SupplySignatures } from "../types";
import { User } from "../UserContext";

// Augment jsPDF to include autoTable type
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface RisItem {
  id?: string;
  stockNo?: string;
  unit?: string;
  name: string;
  quantity?: number; // Request Quantity
  issueQuantity?: number; // Approved/Issued Quantity
  remarks?: string;
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to convert image blob to data URL."));
    };
    reader.onerror = () => reject(new Error("Unable to read image blob."));
    reader.readAsDataURL(blob);
  });

const resolvePdfImageSource = async (
  input?: string,
): Promise<string | undefined> => {
  if (!input) return undefined;
  if (input.startsWith("data:")) return input;

  try {
    const response = await fetch(input);
    if (!response.ok) return undefined;

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return undefined;
  }
};

const generateRisPdf = async (
  items: RisItem[],
  purpose: string = "",
  risNumber: string = "",
  signatures?: SupplySignatures,
  dates?: { requested?: Date; verified?: Date; issued?: Date; received?: Date },
  mode: "download" | "print" | "blob" = "download",
): Promise<Blob | string | undefined> => {
  // 1. Setup Document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a5", // 210mm x 148.5mm
  }) as jsPDFWithAutoTable;

  const pageWidth = 210;
  const leftMargin = 8;
  const rightMargin = 8;
  const topMargin = 8;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // 2. Paginated Logic
  const itemsPerPage = 10; // Fixed back to 10 as requested
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1; // Ensure 1 page minimum

  const resolvedSignatures: SupplySignatures | undefined = signatures
    ? {
        ...signatures,
        requesterSigUrl: await resolvePdfImageSource(
          signatures.requesterSigUrl,
        ),
        approverSigUrl: await resolvePdfImageSource(signatures.approverSigUrl),
        issuerSigUrl: await resolvePdfImageSource(signatures.issuerSigUrl),
        receiverSigUrl: await resolvePdfImageSource(signatures.receiverSigUrl),
      }
    : undefined;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
    }

    const startIdx = page * itemsPerPage;
    const endIdx = Math.min((page + 1) * itemsPerPage, items.length);
    const pageItems = items.slice(startIdx, endIdx);

    // Fill with empty rows if less than itemsPerPage
    while (pageItems.length < itemsPerPage) {
      pageItems.push({ name: "", unit: "", quantity: 0 }); // Empty placeholder
    }

    let currentY = topMargin;

    // ==========================================
    // HEADER
    // ==========================================
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Appendix 63", pageWidth - rightMargin, currentY, {
      align: "right",
    });

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("REQUISITION AND ISSUE SLIP", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 8;

    // Info Block
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Left Column
    const leftColonX = leftMargin + 22;
    const leftValueX = leftColonX + 2;

    const drawHeaderLine = (label: string, value: string, y: number) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, leftMargin, y);
      doc.text(":", leftColonX, y);
      doc.setFont("helvetica", "bold");
      doc.text(value, leftValueX, y);
      const textWidth = doc.getTextWidth(value);
      doc.line(leftValueX, y + 1, leftValueX + textWidth + 10, y + 1); // Reduced underline: content width + 10mm
    };

    drawHeaderLine("Entity Name", "PHILIPPINE STATISTICS AUTHORITY", currentY);

    // Right Column Block - Aligned Colons and shifted left
    const rightLabelX = pageWidth - 85;
    const colonAlignX = pageWidth - 42;
    const rightLineStartX = colonAlignX + 2;

    const drawRightItem = (label: string, value: string, y: number) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, rightLabelX, y);
      doc.text(":", colonAlignX, y);
      if (value) {
        doc.setFont("helvetica", "bold");
        doc.text(value, rightLineStartX, y);
      }
      doc.line(rightLineStartX, y + 1, pageWidth - rightMargin, y + 1);
    };

    drawRightItem("Fund Cluster", "", currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    drawHeaderLine(
      "Division",
      "Aurora Provincial Statistical Office",
      currentY,
    );
    drawRightItem("Responsibility Center Code", "", currentY);

    currentY += 5;
    drawHeaderLine(
      "Office",
      "J.S. Center Brgy. Pingit Baler, Aurora",
      currentY,
    );
    drawRightItem("RIS No.", risNumber || "", currentY);

    currentY += 3;

    // ==========================================
    // TABLE
    // ==========================================
    const tableBody = pageItems.map((item) => {
      // const isPlaceholder = !item.name;
      const reqQty = item.quantity ? item.quantity.toString() : "";

      // Stock Available Logic
      // If issueQuantity is explicitly defined (checked/issued):
      // > 0 -> Yes
      // == 0 -> No
      // undefined -> Blank (Initial Request)
      let yesCheck = "";
      let noCheck = "";
      let issueQtyStr = "";

      if (item.issueQuantity !== undefined && item.name) {
        if (item.issueQuantity > 0) {
          yesCheck = "/";
          issueQtyStr = item.issueQuantity.toString();
        } else {
          noCheck = "/";
          issueQtyStr = "0"; // Explicit 0 if rejected/unavailable
        }
      }

      return [
        item.stockNo || "",
        item.unit || "",
        item.name || "",
        reqQty,
        yesCheck,
        noCheck,
        issueQtyStr,
        item.remarks || "",
      ];
    });

    // Exact Column Widths (Sum = 194mm)
    // Unit increased to 15, Description to 73 (Prev: 10, 78)
    const colWidths = {
      stockNo: 12,
      unit: 15,
      description: 73,
      reqQty: 16,
      yes: 8,
      no: 8,
      issueQty: 16,
      remarks: 46,
    };

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: "Requisition", colSpan: 4, styles: { halign: "center" } },
          {
            content: "Stock Available?",
            colSpan: 2,
            styles: { halign: "center" },
          },
          { content: "Issue", colSpan: 2, styles: { halign: "center" } },
        ],
        [
          "Stock No.",
          "Unit",
          "Description",
          "Quantity",
          "Yes",
          "No",
          "Quantity",
          "Remarks",
        ],
      ],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 0.75,
        minCellHeight: 5.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.15,
        textColor: [0, 0, 0],
        valign: "middle",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.15,
        minCellHeight: 5.5,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: colWidths.stockNo, halign: "center" },
        1: { cellWidth: colWidths.unit, halign: "center" },
        2: { cellWidth: colWidths.description },
        3: { cellWidth: colWidths.reqQty, halign: "center" },
        4: { cellWidth: colWidths.yes, halign: "center" },
        5: { cellWidth: colWidths.no, halign: "center" },
        6: { cellWidth: colWidths.issueQty, halign: "center" },
        7: { cellWidth: colWidths.remarks },
      },
      margin: { left: leftMargin, right: rightMargin },
      showHead: "firstPage",
    });

    // ==========================================
    // PURPOSE ROW
    // ==========================================
    let finalY = doc.lastAutoTable.finalY;

    doc.setLineWidth(0.15);
    doc.rect(leftMargin, finalY, contentWidth, 6);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Purpose:", leftMargin + 2, finalY + 4);
    doc.setFont("helvetica", "bold");
    doc.text(purpose || "", leftMargin + 20, finalY + 4);

    finalY += 6;

    // ==========================================
    // SIGNATURE BLOCK
    // ==========================================
    const sigRowHeight = 13; // Increased for better signature visibility
    const colWidth = (contentWidth - 25) / 4; // 25mm for label col

    const col1X = leftMargin + 25;
    const col2X = col1X + colWidth;
    const col3X = col2X + colWidth;
    const col4X = col3X + colWidth;

    // 1. Headers
    doc.rect(leftMargin, finalY, contentWidth, 5);
    doc.line(col1X, finalY, col1X, finalY + 5 + (sigRowHeight + 15)); // Vertical lines
    doc.line(col2X, finalY, col2X, finalY + 5 + (sigRowHeight + 15));
    doc.line(col3X, finalY, col3X, finalY + 5 + (sigRowHeight + 15));
    doc.line(col4X, finalY, col4X, finalY + 5 + (sigRowHeight + 15));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text("Requested by:", col1X + 2, finalY + 3.5);
    doc.text("Approved by:", col2X + 2, finalY + 3.5);
    doc.text("Issued by:", col3X + 2, finalY + 3.5);
    doc.text("Received by:", col4X + 2, finalY + 3.5);

    finalY += 5;

    // 2. Rows
    const drawRow = (label: string, y: number, height: number) => {
      doc.rect(leftMargin, y, contentWidth, height);
      doc.setFont("helvetica", "normal");
      doc.text(label, leftMargin + 2, y + height / 2 + 1);
    };

    // Signature Row
    drawRow("Signature :", finalY, sigRowHeight);

    // --- Signature Images ---
    if (resolvedSignatures) {
      const renderSig = (
        url: string | undefined,
        x: number,
        y: number,
        w: number,
        h: number,
      ) => {
        if (url) {
          try {
            // Available space inside the cell with padding
            const maxW = w - 6; // horizontal padding 3mm each side
            const maxH = h - 2; // vertical padding 1mm each side

            // Load image to get natural dimensions for aspect-ratio scaling
            const img = new Image();
            img.src = url;
            const natW = img.naturalWidth || img.width || 300;
            const natH = img.naturalHeight || img.height || 150;
            const aspect = natW / natH;

            // Fit within maxW × maxH while preserving aspect ratio
            let sigWidth = maxW;
            let sigHeight = sigWidth / aspect;
            if (sigHeight > maxH) {
              sigHeight = maxH;
              sigWidth = sigHeight * aspect;
            }

            // Center within cell
            const sigOffsetX = (w - sigWidth) / 2;
            const sigOffsetY = (h - sigHeight) / 2;

            // Base layer — crisp main stroke
            doc.addImage(
              url,
              "PNG",
              x + sigOffsetX,
              y + sigOffsetY,
              sigWidth,
              sigHeight,
            );
            // 2nd layer — very subtle offset for natural ink thickness
            doc.addImage(
              url,
              "PNG",
              x + sigOffsetX + 0.06,
              y + sigOffsetY + 0.03,
              sigWidth,
              sigHeight,
            );
          } catch (e) {
            console.warn("Failed to render signature", e);
          }
        }
      };
      renderSig(
        resolvedSignatures.requesterSigUrl,
        col1X,
        finalY,
        colWidth,
        sigRowHeight,
      );
      renderSig(
        resolvedSignatures.approverSigUrl,
        col2X,
        finalY,
        colWidth,
        sigRowHeight,
      );
      renderSig(
        resolvedSignatures.issuerSigUrl,
        col3X,
        finalY,
        colWidth,
        sigRowHeight,
      );
      renderSig(
        resolvedSignatures.receiverSigUrl,
        col4X,
        finalY,
        colWidth,
        sigRowHeight,
      );
    }

    finalY += sigRowHeight;

    // Printed Name Row
    drawRow("Printed Name :", finalY, 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const centerText = (
      text: string,
      xStart: number,
      width: number,
      y: number,
      uppercase: boolean = true,
    ) => {
      if (!text) return;
      const displayText = uppercase ? text.toUpperCase() : text;
      doc.text(displayText, xStart + width / 2, y, { align: "center" });
    };

    centerText(
      resolvedSignatures?.requester || "",
      col1X,
      colWidth,
      finalY + 3.5,
      true,
    );
    centerText("FERDINAND E. SANTIAGO", col2X, colWidth, finalY + 3.5, true);
    centerText("ABNER JUNE A. TABLAN", col3X, colWidth, finalY + 3.5, true);
    centerText(
      resolvedSignatures?.receiver || resolvedSignatures?.requester || "",
      col4X,
      colWidth,
      finalY + 3.5,
      true,
    );

    finalY += 5;

    // Designation Row
    drawRow("Designation :", finalY, 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    centerText(
      resolvedSignatures?.requesterDesignation || "",
      col1X,
      colWidth,
      finalY + 3.5,
      false,
    );
    centerText(
      "Chief Statistical Specialist",
      col2X,
      colWidth,
      finalY + 3.5,
      false,
    );
    centerText(
      "Statistical Specialist II",
      col3X,
      colWidth,
      finalY + 3.5,
      false,
    );

    // Use receiver's own designation if available, otherwise just leave blank (user didn't specify fallback to requester, just add designation)
    // Wait, user said "add also designation of request by to received by".
    // This implies copying REQUESTER designation if receiver is missing/same.
    // It's safer to just expose the receiver's designation field
    centerText(
      resolvedSignatures?.receiver
        ? resolvedSignatures.receiverDesignation || ""
        : resolvedSignatures?.requesterDesignation || "",
      col4X,
      colWidth,
      finalY + 3.5,
      false,
    );

    finalY += 5;

    // Date Row
    drawRow("Date :", finalY, 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const formatDate = (d?: Date | string) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString();
    };

    centerText(formatDate(dates?.requested), col1X, colWidth, finalY + 3.5);
    centerText(
      formatDate(dates?.verified || dates?.requested),
      col2X,
      colWidth,
      finalY + 3.5,
    );
    centerText(
      formatDate(dates?.issued || dates?.requested),
      col3X,
      colWidth,
      finalY + 3.5,
    );
    centerText(
      formatDate((dates as any)?.received || dates?.requested),
      col4X,
      colWidth,
      finalY + 3.5,
    );
  }

  // 3. Output Logic
  const requesterName = (
    resolvedSignatures?.requester || "UNKNOWN"
  ).toUpperCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `RIS_${requesterName}_${risNumber || "DRAFT"}_${dateStr}.pdf`;

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
    return filename;
  } else if (mode === "blob") {
    return doc.output("blob");
  } else {
    doc.save(filename);
    return filename;
  }
};

// --- ADAPTER ---
// Wraps the user's function to match the signature expected by SupplyPage.tsx
export const generateRIS = async (
  request: any,
  users: User[],
  mode: "print" | "download" = "print",
) => {
  // 1. Map Items
  const items: RisItem[] = request.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: item.requestedQty,
    issueQuantity: [
      "Awaiting Approval",
      "For Issuance",
      "To Receive",
      "History",
    ].includes(request.status)
      ? item.qty
      : undefined,
  }));

  // 2. Map Signatures
  const requester = users.find((u) => u.id === request.requesterId);
  const approver = users.find((u) => u.id === request.approverId);
  const issuer = users.find((u) => u.id === request.issuedById);
  const receiver = users.find((u) => u.id === request.receivedById);

  const signatures: SupplySignatures = {
    requester: requester?.name || request.requester,
    requesterDesignation: requester?.roles?.[0],
    requesterSigUrl: requester?.signature,

    approver: "FERDINAND E. SANTIAGO", // Force fallback if needed, but handled in generator
    approverDesignation: "Chief Statistical Specialist",
    approverSigUrl: approver?.signature,

    issuer: "ABNER JUNE A. TABLAN",
    issuerDesignation: "Statistical Specialist II",
    issuerSigUrl: issuer?.signature,

    receiver: receiver?.name,
    receiverSigUrl: receiver?.signature,
    receiverDesignation: receiver?.roles?.[0], // Added missing mapping
  };

  // 3. Map Dates
  const today = new Date();
  // Try to parse request.date if it's like "2024-02-18", otherwise just use today
  // SupplyRequest uses simplified date like "2h ago", so we fallback to today.
  // If we had a real date field, we'd use it.

  // For now, assume all dates "happened" today or when status allows.
  const dates = {
    requested: today,
    verified: today, // Assuming verified/approved
    issued: ["For Issuance", "To Receive", "History"].includes(request.status)
      ? today
      : undefined,
    received: ["To Receive", "History"].includes(request.status)
      ? today
      : undefined,
  };

  // 4. Call Generator
  await generateRisPdf(
    items,
    request.purpose,
    request.id,
    signatures,
    dates,
    mode,
  );
};
