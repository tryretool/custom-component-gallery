import React from "react";
import { Retool } from "@tryretool/custom-component-support";
import { ReportComponent } from "./smartPdfComponent";

export const ReportWrapper: React.FC = () => {
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
    inspector: "select", label: "PDF Quality",
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
    label: "Show Download",
    inspector: "checkbox",
    description: "Show the download button to export the document as a PDF.",
  });

  const showPreview = !!showPreviewRaw;
  const showDownload = !!showDownloadRaw;

  return (
    <div style={{ width: "100%" }}>
      <ReportComponent
        data={schema}
        fileName={fileName}
        pdfQuality={pdfQuality}
        showPreview={showPreview}
        showDownload={showDownload}
      />
    </div>
  );
};

export default ReportWrapper;
