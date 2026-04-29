import React, { useMemo } from "react";
import { Retool } from "@tryretool/custom-component-support";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./smartPdfComponent.css";

type DocType = "invoice" | "payslip" | "table" | "report" | "generic";

type KVSection = {
  type: "kv";
  title: string;
  data: { label: string; value: any }[];
};
type TableSection = {
  type: "table";
  title: string;
  columns: string[];
  columnKeys: string[];
  rows: any[][];
};
type TextSection = {
  type: "text";
  title: string;
  content: string;
};
type MetricsSection = {
  type: "metrics";
  title: string;
  data: { label: string; value: any }[];
};
type NetPaySection = {
  type: "netpay";
  label: string;
  value: string | number;
};
type TotalSection = {
  type: "total";
  rows: { label: string; value: string | number; isGrand?: boolean }[];
};

type Section =
  | KVSection
  | TableSection
  | TextSection
  | MetricsSection
  | NetPaySection
  | TotalSection;

type HeaderMeta = { label: string; value: any };

type DocumentModel = {
  title: string;
  subtitle?: string;
  logo?: string | null;
  docType: DocType;
  headerMeta: HeaderMeta[];
  sections: Section[];
};

const humanLabel = (k: string): string =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const toStr = (v: any): string => {
  if (v === null || v === undefined || v === "") return "—";

  if (typeof v === "boolean") return v ? "Yes" : "No";

  if (typeof v === "object") {
    try {
      return Object.entries(v)
        .map(([k, val]) => `${k}: ${val ?? "—"}`)
        .join(", ");
    } catch {
      return JSON.stringify(v);
    }
  }

  return String(v);
};

const fmtNum = (v: any): string => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return String(v);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const fmtCurrency = (v: any): string => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return String(v);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const isImageSrc = (v: any): v is string =>
  typeof v === "string" &&
  (v.startsWith("data:image") ||
    /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i.test(v) ||
    (v.startsWith("http") && v.length < 600));

const isMetricArray = (arr: any[]): boolean =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  arr.every(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      Object.keys(item).length <= 3 &&
      ("label" in item || "key" in item || "name" in item || "component" in item) &&
      ("value" in item || "amount" in item || "total" in item)
  );

const isObjectArray = (arr: any[]): boolean =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  typeof arr[0] === "object" &&
  arr[0] !== null &&
  !Array.isArray(arr[0]);

const flattenToKV = (obj: Record<string, any>): { label: string; value: any }[] =>
  Object.entries(obj)
    .filter(([, v]) => !isImageSrc(v) && (typeof v !== "object" || v === null))
    .map(([k, v]) => ({ label: humanLabel(k), value: v }));

const extractLogo = (data: any): string | null => {
  if (!data || typeof data !== "object") return null;
  const candidates = [
    data.logo,
    data.image,
    data.companyLogo,
    data.company?.logo,
    data.header?.logo,
    data.brand?.logo,
    data.vendor?.logo,
  ];
  return candidates.find(isImageSrc) ?? null;
};

const detectType = (data: any): DocType => {
  if (!data || typeof data !== "object") return "generic";

  const flat = Array.isArray(data) ? data[0] ?? {} : data;
  const str = JSON.stringify(flat).toLowerCase();

  const scores: Record<DocType, number> = {
    invoice: 0,
    payslip: 0,
    table: 0,
    report: 0,
    generic: 0,
  };

  [
    ["invoice", 4], ["invoicenumber", 5], ["invoiceno", 5], ["customer", 3],
    ["client", 2], ["billto", 4], ["items", 2], ["lineitem", 5], ["subtotal", 5],
    ["tax", 2], ["gst", 4], ["vat", 4], ["total", 2], ["grandtotal", 5],
    ["duedate", 4], ["paymentterms", 5], ["vendor", 3], ["seller", 3],
  ].forEach(([k, w]) => { if (str.includes(k as string)) scores.invoice += w as number; });

  [
    ["payslip", 6], ["payroll", 5], ["salary", 4], ["salaryslip", 6],
    ["employee", 4], ["employeeid", 5], ["earnings", 5], ["deductions", 5],
    ["allowance", 4], ["basic", 3], ["hra", 5], ["pf", 3], ["epf", 5],
    ["esi", 4], ["tds", 4], ["netpay", 6], ["grosspay", 6], ["net_pay", 6],
    ["gross_pay", 6], ["department", 3], ["designation", 4], ["payperiod", 5],
  ].forEach(([k, w]) => { if (str.includes(k as string)) scores.payslip += w as number; });

  if (Array.isArray(data) && data.length > 0 && isObjectArray(data)) {
    scores.table += 12;
  }

  [
    ["report", 4], ["summary", 3], ["analysis", 3], ["dashboard", 3],
    ["metric", 3], ["performance", 3], ["revenue", 3], ["kpi", 5],
  ].forEach(([k, w]) => { if (str.includes(k as string)) scores.report += w as number; });

  const winner = (Object.keys(scores) as DocType[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  return scores[winner] >= 4 ? winner : "generic";
};

const buildInvoice = (data: any, logo: string | null): DocumentModel => {
  const sections: Section[] = [];

  const headerMeta: HeaderMeta[] = [
    data.invoiceNumber && { label: "Invoice #", value: data.invoiceNumber },
    data.invoiceNo && { label: "Invoice #", value: data.invoiceNo },
    data.invoice_number && { label: "Invoice #", value: data.invoice_number },
    data.date && { label: "Date", value: data.date },
    data.invoiceDate && { label: "Date", value: data.invoiceDate },
    data.dueDate && { label: "Due", value: data.dueDate },
    data.due_date && { label: "Due", value: data.due_date },
  ].filter(Boolean) as HeaderMeta[];

  const detailKeys = ["invoiceNumber", "invoiceNo", "invoice_number", "invoice_no", "date",
    "invoiceDate", "invoice_date", "dueDate", "due_date", "paymentTerms", "payment_terms", "currency", "reference"];
  const detailData = detailKeys
    .filter((k) => data[k] !== undefined)
    .map((k) => ({ label: humanLabel(k), value: data[k] }));
  if (detailData.length > 0)
    sections.push({ type: "kv", title: "Invoice Details", data: detailData });

  const customerSrc = data.customer || data.client || data.billTo || data.bill_to;
  if (customerSrc) {
    if (typeof customerSrc === "string") {
      sections.push({ type: "kv", title: "Bill To", data: [{ label: "Name", value: customerSrc }] });
    } else if (typeof customerSrc === "object") {
      const kv = flattenToKV(customerSrc);
      if (kv.length) sections.push({ type: "kv", title: "Bill To", data: kv });
    }
  }

  const vendorSrc = data.vendor || data.seller || data.from || data.company;
  if (vendorSrc && typeof vendorSrc === "object") {
    const kv = flattenToKV(vendorSrc);
    if (kv.length) sections.push({ type: "kv", title: "From", data: kv });
  }

  const items: any[] = data.items || data.lineItems || data.line_items || [];
  if (items.length > 0 && typeof items[0] === "object") {
    const keys = Object.keys(items[0]);
    sections.push({
      type: "table",
      title: "Line Items",
      columns: keys.map(humanLabel),
      columnKeys: keys,
      rows: items.map((item) => keys.map((k) => item[k])),
    });
  }

  const totalKeys = ["subtotal", "sub_total", "discount", "shipping", "tax", "gst", "vat",
    "total", "grandTotal", "grand_total", "amountDue", "amount_due", "balanceDue", "balance_due"];
  const totalRows = totalKeys
    .filter((k) => data[k] !== undefined)
    .map((k) => ({
      label: humanLabel(k),
      value: fmtCurrency(data[k]),
      isGrand: ["total", "grandTotal", "grand_total", "amountDue", "amount_due", "balanceDue", "balance_due"]
        .includes(k),
    }));
  if (totalRows.length) sections.push({ type: "total", rows: totalRows });

  const notes = data.notes || data.terms || data.remarks || data.note;
  if (notes && typeof notes === "string")
    sections.push({ type: "text", title: "Notes & Terms", content: notes });

  const used = new Set(["logo", "image", "title", "subtitle", "invoiceNumber", "invoiceNo",
    "invoice_number", "invoice_no", "date", "invoiceDate", "invoice_date", "dueDate", "due_date",
    "paymentTerms", "payment_terms", "currency", "reference", "customer", "client", "billTo", "bill_to",
    "vendor", "seller", "from", "company", "items", "lineItems", "line_items", ...totalKeys,
    "notes", "terms", "remarks", "note"]);
  const remaining = Object.entries(data)
    .filter(([k, v]) => !used.has(k) && typeof v !== "object" && !isImageSrc(v))
    .map(([k, v]) => ({ label: humanLabel(k), value: v }));
  if (remaining.length)
    sections.push({ type: "kv", title: "Additional Info", data: remaining });

  return {
    title: data.title || "INVOICE",
    subtitle: data.invoiceNumber
      ? `Invoice #${data.invoiceNumber}`
      : data.invoiceNo
        ? `Invoice #${data.invoiceNo}`
        : undefined,
    logo,
    docType: "invoice",
    headerMeta,
    sections,
  };
};

const buildPayslip = (data: any, logo: string | null): DocumentModel => {
  const sections: Section[] = [];

  const headerMeta: HeaderMeta[] = [
    (data.month || data.payPeriod) && { label: "Period", value: data.month || data.payPeriod },
    data.payDate && { label: "Pay Date", value: data.payDate },
    (data.employeeId || data.employee?.employeeId || data.employee?.id) && {
      label: "Employee ID",
      value: data.employeeId || data.employee?.employeeId || data.employee?.id,
    },
  ].filter(Boolean) as HeaderMeta[];

  const companySrc = data.company || data.employer || data.organization;
  if (companySrc && typeof companySrc === "object") {
    const kv = flattenToKV(companySrc);
    if (kv.length) sections.push({ type: "kv", title: "Company", data: kv });
  } else if (data.companyName || data.company_name) {
    sections.push({ type: "kv", title: "Company", data: [{ label: "Name", value: data.companyName || data.company_name }] });
  }

  const empSrc = data.employee || data.employeeDetails || data.emp;
  if (empSrc && typeof empSrc === "object") {
    const kv = flattenToKV(empSrc);
    if (kv.length) sections.push({ type: "kv", title: "Employee Details", data: kv });
  } else {
    const empKeys = ["employeeId", "employee_id", "empId", "name", "employeeName", "employee_name",
      "department", "designation", "grade", "location", "pan", "uan", "bankAccount", "bank_account"];
    const empData = empKeys.filter((k) => data[k]).map((k) => ({ label: humanLabel(k), value: data[k] }));
    if (empData.length) sections.push({ type: "kv", title: "Employee Details", data: empData });
  }

  const metaKeys = ["payPeriod", "pay_period", "month", "year", "payDate", "pay_date", "paymentMode", "payment_mode", "pfNumber", "uanNumber"];
  const metaData = metaKeys.filter((k) => data[k]).map((k) => ({ label: humanLabel(k), value: data[k] }));
  if (metaData.length) sections.push({ type: "kv", title: "Pay Period", data: metaData });

  const earningsSrc: any[] = data.earnings || data.allowances || [];
  if (Array.isArray(earningsSrc) && earningsSrc.length > 0) {
    if (isMetricArray(earningsSrc)) {
      sections.push({
        type: "kv",
        title: "Earnings",
        data: earningsSrc.map((e) => ({
          label: e.label || e.key || e.name || e.component || "Item",
          value: fmtCurrency(e.value ?? e.amount ?? e.total ?? 0),
        })),
      });
    } else if (isObjectArray(earningsSrc)) {
      const keys = Object.keys(earningsSrc[0]);
      sections.push({
        type: "table",
        title: "Earnings",
        columns: keys.map(humanLabel),
        columnKeys: keys,
        rows: earningsSrc.map((r) => keys.map((k) => r[k])),
      });
    }
  }

  const deductionsSrc: any[] = data.deductions || [];
  if (Array.isArray(deductionsSrc) && deductionsSrc.length > 0) {
    if (isMetricArray(deductionsSrc)) {
      sections.push({
        type: "kv",
        title: "Deductions",
        data: deductionsSrc.map((d) => ({
          label: d.label || d.key || d.name || d.component || "Item",
          value: fmtCurrency(d.value ?? d.amount ?? d.total ?? 0),
        })),
      });
    } else if (isObjectArray(deductionsSrc)) {
      const keys = Object.keys(deductionsSrc[0]);
      sections.push({
        type: "table",
        title: "Deductions",
        columns: keys.map(humanLabel),
        columnKeys: keys,
        rows: deductionsSrc.map((r) => keys.map((k) => r[k])),
      });
    }
  }

  const netPay =
    data.netPay ?? data.net_pay ?? data.netSalary ?? data.net_salary ??
    data.takeHome ?? data.take_home;
  if (netPay !== undefined)
    sections.push({ type: "netpay", label: "Net Pay", value: fmtCurrency(netPay) });

  return {
    title: data.title || "SALARY SLIP",
    subtitle: data.month
      ? `Pay Period: ${data.month}${data.year ? " " + data.year : ""}`
      : data.payPeriod || undefined,
    logo,
    docType: "payslip",
    headerMeta,
    sections,
  };
};

const buildTable = (data: any[]): DocumentModel => {
  const keys = Object.keys(data[0] || {});
  return {
    title: "Data Table",
    docType: "table",
    logo: null,
    headerMeta: [{ label: "Rows", value: data.length }],
    sections: [
      {
        type: "table",
        title: "Records",
        columns: keys.map(humanLabel),
        columnKeys: keys,
        rows: data.map((row) => keys.map((k) => row[k])),
      },
    ],
  };
};

const buildGeneric = (data: any, logo: string | null): DocumentModel => {
  const sections: Section[] = [];

  const processNode = (node: any, title: string, depth = 0): void => {
    if (node === null || node === undefined) return;
    if (depth > 5) return;

    if (typeof node === "string") {
      if (node.length > 100) {
        sections.push({ type: "text", title, content: node });
      } else {
        sections.push({ type: "kv", title, data: [{ label: title, value: node }] });
      }
      return;
    }

    if (typeof node !== "object") {
      sections.push({ type: "kv", title, data: [{ label: title, value: node }] });
      return;
    }

    if (Array.isArray(node)) {
      if (node.length === 0) return;
      if (isMetricArray(node)) {
        sections.push({
          type: "metrics",
          title,
          data: node.map((item) => ({
            label: item.label || item.key || item.name || item.component || "—",
            value: item.value ?? item.amount ?? item.total ?? "—",
          })),
        });
        return;
      }
      if (isObjectArray(node)) {
        const keys = Object.keys(node[0]);
        sections.push({
          type: "table",
          title,
          columns: keys.map(humanLabel),
          columnKeys: keys,
          rows: node.map((row) => keys.map((k) => row[k])),
        });
        return;
      }
      sections.push({ type: "text", title, content: node.map(toStr).join(", ") });
      return;
    }

    const scalars: { label: string; value: any }[] = [];
    const nested: [string, any][] = [];

    Object.entries(node).forEach(([k, v]) => {
      if (isImageSrc(v)) return;
      if (v === null || typeof v !== "object") {
        scalars.push({ label: humanLabel(k), value: v });
      } else {
        nested.push([humanLabel(k), v]);
      }
    });

    if (scalars.length) sections.push({ type: "kv", title, data: scalars });
    nested.forEach(([k, v]) => processNode(v, k, depth + 1));
  };

  if (Array.isArray(data)) {
    processNode(data, "Data");
  } else {
    processNode(data, "Details");
  }

  return {
    title: data?.title || data?.name || "Document",
    subtitle: data?.subtitle || data?.description || undefined,
    logo,
    docType: "generic",
    headerMeta: [],
    sections,
  };
};

const generatePDF = async (model: DocumentModel, fileName?: string, pdfQuality: "high" | "mid" | "low" = "high"): void => {
  const qualityMap = { high: { compress: false, precision: 16 }, mid: { compress: true, precision: 12 }, low: { compress: true, precision: 8 }, }; const q = qualityMap[pdfQuality] || qualityMap.high; const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: q.compress, precision: q.precision, }); const W = 210; const margin = 14; const colW = W - margin * 2; let y = margin;

  const C = {
    primary: [15, 23, 42] as [number, number, number],
    accent: [29, 78, 216] as [number, number, number],
    green: [5, 150, 105] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    muted: [107, 114, 128] as [number, number, number],
    border: [229, 231, 235] as [number, number, number],
    rowAlt: [249, 250, 251] as [number, number, number],
    highlight: [239, 246, 255] as [number, number, number],
  };

  const docAccent: Record<DocType, [number, number, number]> = {
    invoice: [29, 78, 216],
    payslip: [5, 150, 105],
    table: [124, 58, 237],
    report: [13, 148, 136],
    generic: [68, 64, 60],
  };
  const accent = docAccent[model.docType] ?? C.accent;

  const checkPage = (need = 20): void => {
    if (y + need > 280) { pdf.addPage(); y = margin; }
  };

  const drawSectionBanner = (title: string): void => {
    checkPage(12);
    pdf.setFillColor(...accent);
    pdf.rect(margin, y, colW, 8, "F");
    pdf.setTextColor(...C.white);
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.text(title.toUpperCase(), margin + 4, y + 5.5);
    y += 11;
    pdf.setTextColor(...C.text);
  };

  pdf.setFillColor(...C.primary);
  pdf.rect(0, 0, W, 42, "F");

  pdf.setFillColor(...accent);
  pdf.rect(0, 40, W, 2, "F");

  let logoOffset = 0;
  const addSafeImage = async (src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  if (model.logo) {
    try {
      const img = await addSafeImage(model.logo);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = 200;
      canvas.height = 200;

      ctx?.drawImage(img, 0, 0, 200, 200);

      const dataUrl = canvas.toDataURL("image/jpeg", 1);

      pdf.addImage(
        dataUrl,
        "JPEG",
        margin,
        9,
        22,
        22,
        undefined,
        pdfQuality === "high" ? "NONE" : "FAST"
      );

      logoOffset = 27;
    } catch (e) {
      console.warn("Logo failed, fallback to icon");
    }
  }

  pdf.setTextColor(...C.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(model.title, margin + logoOffset, 21, {
    baseline: "middle",
  });

  if (model.subtitle) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(200, 210, 230);
    pdf.text(model.subtitle, margin + logoOffset, 30);
  }

  pdf.setFillColor(...accent);
  pdf.roundedRect(W - margin - 26, 11, 24, 8, 2, 2, "F");
  pdf.setTextColor(...C.white);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.text(model.docType.toUpperCase(), W - margin - 14, 16.5, { align: "center" });

  if (model.headerMeta.length > 0) {
    let mx = W - margin;
    let my = 27;
    model.headerMeta.slice(0, 3).forEach((m) => {
      const str = `${m.label}: ${toStr(m.value)}`;
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 200, 220);
      pdf.text(str, mx, my, { align: "right" });
      my += 5;
    });
  }

  y = 50;
  pdf.setTextColor(...C.text);

  for (const section of model.sections) {
    checkPage(18);
    if (section.type === "kv") {
      drawSectionBanner(section.title);

      const half = (colW - 4) / 2;

      for (let i = 0; i < section.data.length; i += 2) {
        const left = section.data[i];
        const right = section.data[i + 1];

        const leftLines = pdf.splitTextToSize(toStr(left?.value), half - 6);
        const rightLines = right
          ? pdf.splitTextToSize(toStr(right?.value), half - 6)
          : [];

        const leftHeight = 6 + leftLines.length * 5;
        const rightHeight = 6 + rightLines.length * 5;

        const rowHeight = Math.max(12, leftHeight, rightHeight);

        checkPage(rowHeight + 4);

        pdf.setFillColor(...C.rowAlt);
        pdf.rect(margin, y, half, rowHeight, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...C.muted);
        pdf.text(left.label, margin + 3, y + 4);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...C.text);
        pdf.text(leftLines, margin + 3, y + 9);

        if (right) {
          const xRight = margin + half + 4;

          pdf.setFillColor(...C.white);
          pdf.rect(xRight, y, half, rowHeight, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.setTextColor(...C.muted);
          pdf.text(right.label, xRight + 3, y + 4);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...C.text);
          pdf.text(rightLines, xRight + 3, y + 9);
        }
        y += rowHeight + 3;
      }

      y += 5;
    }

    if (section.type === "table") {
      drawSectionBanner(section.title);
      if (!Array.isArray(section.rows)) return;
      autoTable(pdf, {
        startY: y,
        head: [section.columns],
        body: section.rows.map((row) => {
          if (Array.isArray(row)) {
            return row.map((c) => toStr(c));
          }

          return section.columnKeys.map((key) =>
            toStr(row?.[key])
          );
        }),
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: C.border,
          lineWidth: 0.2,
          textColor: C.text,
          font: "helvetica",
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: accent,
          textColor: C.white,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: C.rowAlt },
        tableWidth: colW,
        didDrawPage: (d: any) => { y = d.cursor.y + 4; },
      });
      y = (pdf as any).lastAutoTable?.finalY + 8 ?? y;
    }

    if (section.type === "text") {
      drawSectionBanner(section.title);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.muted);
      const lines = pdf.splitTextToSize(section.content, colW - 6);
      lines.forEach((line: string) => {
        checkPage(6);
        pdf.text(line, margin + 3, y + 4);
        y += 5.5;
      });
      y += 5;
    }

    if (section.type === "metrics") {
      drawSectionBanner(section.title);
      const cardW = (colW - 8) / 3;
      let col = 0;
      let rowY = y;

      section.data.forEach((m) => {
        const xOff = margin + col * (cardW + 4);
        if (col === 0) rowY = y;
        checkPage(22);

        pdf.setFillColor(...C.highlight);
        pdf.roundedRect(xOff, rowY, cardW, 18, 2, 2, "F");
        pdf.setFillColor(...accent);
        pdf.rect(xOff, rowY, 2.5, 18, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...accent);
        pdf.text(toStr(m.value), xOff + cardW / 2, rowY + 9, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...C.muted);
        pdf.text(m.label, xOff + cardW / 2, rowY + 15, { align: "center" });

        col++;
        if (col === 3) { col = 0; y += 22; }
      });
      if (col !== 0) y += 22;
      y += 5;
    }

    if (section.type === "netpay") {
      checkPage(26);
      pdf.setFillColor(...C.green);
      pdf.rect(margin, y, colW, 22, "F");

      pdf.setFillColor(0, 120, 80);
      pdf.rect(margin, y, 4, 22, "F");

      pdf.setTextColor(...C.white);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(section.label.toUpperCase(), margin + 9, y + 9);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(180, 240, 220);
      pdf.text("Amount (INR)", margin + 9, y + 17);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...C.white);
      pdf.text(toStr(section.value), W - margin - 6, y + 14, {
        align: "right",
        baseline: "middle",
      });

      y += 28;
    }

    if (section.type === "total") {
      checkPage(section.rows.length * 10 + 10);
      const totW = Math.min(colW, 160);
      const totX = W - margin - totW;

      section.rows.forEach((row) => {
        if (row.isGrand) {
          pdf.setFillColor(...C.highlight);
          pdf.rect(totX, y, totW, 11, "F");
          pdf.setDrawColor(...accent);
          pdf.setLineWidth(0.5);
          pdf.line(totX, y, totX + totW, y);
        }
        pdf.setFont("helvetica", row.isGrand ? "bold" : "normal");
        pdf.setFontSize(row.isGrand ? 9.5 : 8.5);
        pdf.setTextColor(...(row.isGrand ? accent : C.muted));
        pdf.text(row.label, totX + 4, y + 7);
        pdf.text(String(row.value), W - margin - 4, y + 7, { align: "right" });
        y += row.isGrand ? 13 : 10;
      });
      y += 5;
    }
  }

  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 287, W, 10, "F");
    pdf.setTextColor(...C.white);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(
      `${model.title}   |   Page ${p} of ${totalPages}   |   Generated by Smart PDF Engine`,
      W / 2, 293,
      { align: "center" }
    );
  }

  pdf.save(fileName || `${model.title.replace(/\s+/g, "_")}.pdf`);
};

const ACCENT_CLASSES = ["accent-blue", "accent-teal", "accent-violet", "accent-amber", "accent-green", "accent-rose"];
const STRIPE_CLASSES = ["stripe-blue", "stripe-teal", "stripe-violet", "stripe-amber", "stripe-green", "stripe-rose"];

const getAccentClass = (i: number): string => ACCENT_CLASSES[i % ACCENT_CLASSES.length];
const getStripeClass = (i: number): string => STRIPE_CLASSES[i % STRIPE_CLASSES.length];

const DOC_ICONS: Record<DocType, string> = {
  invoice: "🧾",
  payslip: "💰",
  table: "📊",
  report: "📈",
  generic: "📄",
};

const isNumericLike = (v: any): boolean => {
  if (typeof v === "number") return true;
  if (typeof v === "string") return !isNaN(parseFloat(v)) && /^[\d,.% ]+$/.test(v.trim());
  return false;
};

const isCurrencyLike = (label: string, v: any): boolean => {
  const l = label.toLowerCase();
  return (
    (l.includes("amount") || l.includes("salary") || l.includes("pay") ||
      l.includes("total") || l.includes("cost") || l.includes("price") ||
      l.includes("fee") || l.includes("tax") || l.includes("gst")) &&
    isNumericLike(v)
  );
};

const RenderKV: React.FC<{ section: KVSection; idx: number }> = ({ section, idx }) => (
  <div className="doc-section">
    <div className="doc-section-header">
      <div className={`doc-section-accent ${getAccentClass(idx)}`} />
      <div className="doc-section-title">{section.title}</div>
    </div>
    <div className="doc-divider" />
    <div className="doc-kv-grid">
      {section.data.map((item, j) => {
        const currency = isCurrencyLike(item.label, item.value);
        const numeric = !currency && isNumericLike(item.value);
        return (
          <div key={j} className="doc-kv-item">
            <div className="doc-kv-label">{item.label}</div>
            <div
              className={`doc-kv-value${currency ? " is-currency" : numeric ? " is-number" : ""}`}
            >
              {currency ? fmtCurrency(item.value) : toStr(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const RenderTable: React.FC<{ section: TableSection; idx: number }> = ({ section, idx }) => (
  <div className="doc-section">
    <div className="doc-section-header">
      <div className={`doc-section-accent ${getAccentClass(idx)}`} />
      <div className="doc-section-title">{section.title}</div>
    </div>
    <div className="doc-divider" />
    <div className="doc-table-wrapper">
      <table>
        <thead>
          <tr>
            {section.columns.map((col, c) => <th key={c}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row: any, i: number) => (
            <tr key={i}>

              {Array.isArray(row) &&
                row.map((cell: any, j: number) => (
                  <td key={j}>
                    {toStr(cell)}
                  </td>
                ))}

              {!Array.isArray(row) &&
                section.columnKeys?.map((key: string, j: number) => (
                  <td key={j}>
                    {toStr(row[key])}
                  </td>
                ))}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="doc-table-count">{section.rows.length} row{section.rows.length !== 1 ? "s" : ""}</div>
  </div>
);

const RenderText: React.FC<{ section: TextSection; idx: number }> = ({ section, idx }) => (
  <div className="doc-section">
    <div className="doc-section-header">
      <div className={`doc-section-accent ${getAccentClass(idx)}`} />
      <div className="doc-section-title">{section.title}</div>
    </div>
    <div className="doc-divider" />
    <div className="doc-text-block">{section.content}</div>
  </div>
);

const RenderMetrics: React.FC<{ section: MetricsSection; idx: number }> = ({ section, idx }) => (
  <div className="doc-section">
    <div className="doc-section-header">
      <div className={`doc-section-accent ${getAccentClass(idx)}`} />
      <div className="doc-section-title">{section.title}</div>
    </div>
    <div className="doc-divider" />
    <div className="doc-metrics-grid">
      {section.data.map((m, j) => (
        <div key={j} className={`doc-metric-card ${getStripeClass(j)}`}>
          <div className="doc-metric-value">{toStr(m.value)}</div>
          <div className="doc-metric-label">{m.label}</div>
        </div>
      ))}
    </div>
  </div>
);

const RenderNetPay: React.FC<{ section: NetPaySection }> = ({ section }) => (
  <div className="doc-section">
    <div className="doc-netpay">
      <div>
        <div className="doc-netpay-label">{section.label}</div>
      </div>
      <div className="doc-netpay-value">{toStr(section.value)}</div>
    </div>
  </div>
);

const RenderTotal: React.FC<{ section: TotalSection }> = ({ section }) => (
  <div className="doc-section">
    <div className="doc-totals">
      {section.rows.map((row, i) => (
        <div key={i} className={`doc-total-row${row.isGrand ? " is-grand" : ""}`}>
          <span className="doc-total-label">{row.label}</span>
          <span className="doc-total-amount">{toStr(row.value)}</span>
        </div>
      ))}
    </div>
  </div>
);

type Props = {
  data?: any;
  fileName?: string;
  pdfQuality?: "high" | "mid" | "low";
  showPreview?: boolean;
  showDownload?: boolean;
};

export const ReportComponent: React.FC<Props> = ({
  data,
  fileName: propFileName,
  pdfQuality: propPdfQuality,
  showPreview: propShowPreview,
  showDownload: propShowDownload
}) => {
  const [schema] = Retool.useStateObject({
    name: "schema",
    label: "Input Data",
    description: "Provide the JSON data to generate and render the document.",
  });

  const [fileName] = Retool.useStateString({
    name: "fileName",
    label: "File Name",
    description: "Optional name for the downloaded PDF file. If empty, a default name will be used.",
  });

  const [pdfQuality] = Retool.useStateEnumeration({
    name: "pdfQuality",
    enumDefinition: ["high", "mid", "low"],
    initialValue: "high",
    enumLabels: { high: "High", mid: "Medium", low: "Low", },
    inspector: "select",
    label: "PDF Quality",
    description: "Controls PDF size (not visual quality)",
  });

  const [showPreviewRaw] = Retool.useStateBoolean({
    name: "showPreview",
    initialValue: true,
    label: "Show Preview",
    inspector: "checkbox",
    description: "Display a live preview of the document inside the component.",
  });

  const [showDownloadRaw] = Retool.useStateBoolean({
    name: "showDownload",
    initialValue: true,
    label: "Show Download Button",
    inspector: "checkbox",
    description: "Show the download button to export the document as a PDF.",
  });

  const [buttonAlign] = Retool.useStateEnumeration({
    name: "buttonAlign",
    label: "Button Alignment",
    inspector: "select",
    enumDefinition: ["left", "center", "right", "full"],
    enumLabels: {
      left: "Left Align",
      center: "Center Align",
      right: "Right Align",
      full: "Full Width"
    },
    description: "Controls position of download button",
    initialValue: "right"
  });

  const [buttonVariant] = Retool.useStateEnumeration({
    name: "buttonVariant",
    label: "Button Style",
    inspector: "select",
    enumDefinition: ["text", "icon", "both"],
    enumLabels: {
      text: "Text Only",
      icon: "Icon Only",
      both: "Icon + Text"
    },
    description: "Choose how button appears",
    initialValue: "both"
  });

  const [buttonIcon] = Retool.useStateEnumeration({
    name: "buttonIcon",
    label: "Button Icon",
    inspector: "select",
    enumDefinition: ["download", "file", "arrow"],
    enumLabels: {
      download: "Download Icon",
      file: "File Icon",
      arrow: "Arrow Icon"
    },
    initialValue: "download",
    description: "Select icon for the download button"
  });

  const [buttonText] = Retool.useStateString({
    name: "buttonText",
    label: "Button Text",
    initialValue: "Download PDF",
    description: "Customize the label displayed on the download button. Leave empty to use the default text.",
  });

  const finalData = data ?? schema;
  const finalFileName = propFileName ?? fileName;
  const finalPdfQuality = propPdfQuality ?? pdfQuality;
  const showPreview = propShowPreview ?? showPreviewRaw;
  const showDownload = propShowDownload ?? showDownloadRaw;

  const normalizeAnyData = (input: any): DocumentModel => {
    if (!input) {
      return {
        title: "Empty",
        docType: "generic",
        logo: null,
        headerMeta: [],
        sections: [],
      };
    }

    if (input.sections) {
      const detectedType = input.docType || detectType(input);
      return {
        title: input.title || "Document",
        subtitle: input.subtitle || "",
        docType: detectedType,
        logo: input.logo || null,
        headerMeta: input.headerMeta || [],
        sections: input.sections.map((sec: any) => {
          if (sec.type === "grid") {
            return { type: "kv", title: sec.title, data: sec.data || [] };
          }

          if (sec.type === "summary") {
            return {
              type: "total",
              rows: (sec.data || []).map((d: any) => ({
                label: d.label,
                value: d.value,
                isGrand: d.label?.toLowerCase().includes("total"),
              })),
            };
          }

          if (sec.type === "table") {
            const cols = sec.columns || [];
            const keys = cols.map((c: any) =>
              typeof c === "string" ? c : c.key
            );

            return {
              type: "table",
              title: sec.title,
              columns: cols.map((c: any) =>
                typeof c === "string" ? c : c.label
              ),
              columnKeys: keys,
              rows: (sec.rows || []).map((row: any) =>
                Array.isArray(row) ? row : keys.map((k) => row?.[k])
              ),
            };
          }

          if (sec.type === "text") {
            return {
              type: "text",
              title: sec.title,
              content: sec.value || sec.content || "",
            };
          }

          return sec;
        }),
      };
    }

    const sections: any[] = [];

    Object.entries(input).forEach(([key, value]) => {
      if (["title", "subtitle", "docType", "logo", "headerMeta"].includes(key))
        return;

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.values(value).every(v => typeof v !== "object")
      ) {
        sections.push({
          type: "kv",
          title: humanLabel(key),
          data: Object.entries(value).map(([k, v]) => ({
            label: humanLabel(k),
            value: v,
          })),
        });
      }

      else if (Array.isArray(value)) {
        if (value.length === 0) return;

        const first = value[0];

        if (typeof first === "object") {
          const keys = Object.keys(first);

          sections.push({
            type: "table",
            title: humanLabel(key),
            columns: keys.map(humanLabel),
            columnKeys: keys,
            rows: value.map((row: any) =>
              keys.map((k) => row?.[k])
            ),
          });
        } else {
          sections.push({
            type: "text",
            title: humanLabel(key),
            content: value.join(", "),
          });
        }
      }

      else {
        sections.push({
          type: "kv",
          title: humanLabel(key),
          data: [{ label: humanLabel(key), value }],
        });
      }
    });

    const detectedType = input.docType || detectType(input);

    return {
      title: input.title || "Document",
      subtitle: input.subtitle || input.month || "",
      docType: detectedType,
      logo: input.logo || null,
      headerMeta: input.headerMeta || [],
      sections,
    };
  };

  const model = useMemo(() => {
    try {
      const safe = JSON.parse(JSON.stringify(finalData ?? {}));
      return normalizeAnyData(safe);
    } catch {
      return {
        title: "Error",
        docType: "generic",
        logo: null,
        headerMeta: [],
        sections: [
          { type: "text", title: "Error", content: "Invalid data." }
        ],
      };
    }
  }, [finalData]);

  const handleDownload = async (): Promise<void> => {
    await generatePDF(model, finalFileName, finalPdfQuality);
  };


  return (
    <div className="doc-root">

      {!showPreview && !showDownload && (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
          Nothing to display
        </div>
      )}

      {(showPreview || showDownload) && (
        <>

          <div className="doc-toolbar">

            {showPreview && (
              <div className="doc-toolbar-left">
                <div className={`doc-type-pill ${model.docType}`}>
                  <span className="doc-type-pill-dot" />
                  {DOC_ICONS[model.docType]} {model.docType}
                </div>
                <span style={{ fontSize: 12, color: "var(--ink-40)" }}>
                  {model.sections.length} section
                  {model.sections.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {showDownload && (
              <div className={`doc-toolbar-right align-${buttonAlign}`}>
                <button
                  className={`doc-download-btn ${buttonAlign === "full" ? "full-width" : ""}`}
                  onClick={handleDownload}
                >

                  {(buttonVariant === "icon" || buttonVariant === "both") && (
                    <>
                      {buttonIcon === "download" && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 1v9M4 7l4 4 4-4M2 13h12"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {buttonIcon === "file" && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M3 2h6l4 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
                            stroke="white"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 2v4h4"
                            stroke="white"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {buttonIcon === "arrow" && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M3 8h10M9 4l4 4-4 4"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </>
                  )}

                  {(buttonVariant === "text" || buttonVariant === "both") && (
                    <span>{buttonText || "Download PDF"}</span>
                  )}

                </button>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="doc-paper">
              <div className={`doc-header ${model.docType}`}>
                <div className="doc-header-inner">

                  <div className="doc-header-left">
                    <div className="doc-logo-wrap">
                      {model.logo ? (
                        <img
                          src={model.logo}
                          alt="Logo"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="doc-logo-icon">
                          {DOC_ICONS[model.docType]}
                        </span>
                      )}
                    </div>

                    <div className="doc-header-titles">
                      <div className="doc-header-title">{model.title}</div>
                      {model.subtitle && (
                        <div className="doc-header-subtitle">
                          {model.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {model.headerMeta.length > 0 && (
                    <div className="doc-header-meta">
                      {model.headerMeta.slice(0, 3).map((m, i) => (
                        <div key={i} className="doc-header-meta-row">
                          <span className="doc-header-meta-label">
                            {m.label}
                          </span>
                          <span className="doc-header-meta-value">
                            {toStr(m.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="doc-body">
                {model.sections.length === 0 ? (
                  <div className="doc-empty">
                    <div className="doc-empty-icon">📋</div>
                    <div className="doc-empty-text">No content to display</div>
                  </div>
                ) : (
                  model.sections.map((section, i) => {
                    if (section.type === "kv") {
                      return <RenderKV key={i} section={section} idx={i} />;
                    }

                    if (section.type === "table") {
                      return <RenderTable key={i} section={section} idx={i} />;
                    }

                    if (section.type === "text") {
                      return <RenderText key={i} section={section} idx={i} />;
                    }

                    if (section.type === "metrics") {
                      return <RenderMetrics key={i} section={section} idx={i} />;
                    }

                    if (section.type === "netpay") {
                      return <RenderNetPay key={i} section={section} />;
                    }

                    if (section.type === "total") {
                      return <RenderTotal key={i} section={section} />;
                    }

                    return null;
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};