import React, { useState } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

const SmartDataViewer = () => {

  const capitalize = (text: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const [data] = Retool.useStateObject({
    name: "data",
    initialValue: {}
  });

  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!data || typeof data !== "object") {
    return <div className="empty"> No data </div>;
  }

  const entries = Object.entries(data).filter(([k]) =>
    k.toLowerCase().includes(search.toLowerCase())
  );

  const getType = (v : any) => {
    if (v === null || v === undefined) return "null";  
    if (typeof v === "boolean") return "boolean";
    if (Array.isArray(v)) return "array";
    if (typeof v === "object") return "object";
    if (typeof v === "string" && v.startsWith("http")) return "url";
    if (typeof v === "string" && v.includes("@")) return "email";
    if (typeof v === "string" && v.length > 120) return "long";
    return "text";
  };

  const renderValue = (value: any, key: string) => {
    const type = getType(value);
    switch (type) {
      case "boolean":
        return (
          <span className={`chip ${value ? "active" : "inactive"}`}>
            <span className="dot"></span>
            {value ? "Active" : "Inactive"}
          </span>
        );

      case "array":
        return value.map((v: any, i: any) => (
          <span key={i} className="tag">
            {capitalize(String(v))}
          </span>
        ));

      case "object":
        if (!value)
          return <span className="null-text">null</span>;

        return (
          <div className="object-container">
          
            <div
              className="object-header"
              onClick={() =>
                setExpanded({ ...expanded, [key]: !expanded[key] })
              } >
              <span className="arrow">{expanded[key] ? "▾" : "▸"}</span>
              <span className="object-label">Object</span>
              <span className="object-count">
                ({Object.keys(value).length})
              </span>
            </div>

           
            {expanded[key] && (
              <div className="object-children">
                {Object.entries(value).map(([k, v]) => (
                  <div key={k} className="object-row">
                    <div className="object-key"> {capitalize(k)}:</div>
                    <div className="object-value">
                      {renderValue(v, k)} 
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );


      case "null":
        return <span className="badge gray">Null</span>;
      case "url":
        return (
          <a href={value} target="_blank" rel="noreferrer">
            {value} ↗
          </a>
        );

      case "email": return <span> ✉ {value} </span>;

      case "long":
        return (
          <>
            <span>
              {expanded[key]
                ? capitalize(value)
                : capitalize(value.substring(0, 120)) + "..."}
            </span>
            <div
              className="expand"
              onClick={() =>
                setExpanded({ ...expanded, [key]: !expanded[key] })
              }>
              {expanded[key] ? "Show less" : "Show more"}
            </div>
          </>
        );

      default:
        return <span>{capitalize(String(value))}</span>;
    }
  };

  return (
    <div className="wrapper">
      <div className="header">
        <div className="title">
  <div className="title-top">
    <div className="title-icon">🗄</div>
    <div className="title-content">
      <div className="title-text">Data Viewer</div>
      <span>{entries.length} fields</span>
    </div>
  </div>
</div>

        <div className="actions">
          <div className="view-toggle">

            <button
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "active" : ""} >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <button
              onClick={() => setViewMode("card")}
              className={viewMode === "card" ? "active" : ""} >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="6" height="6" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="4" width="6" height="6" stroke="currentColor" strokeWidth="2" />
                <rect x="4" y="14" width="6" height="6" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="6" height="6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

      
            <button
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "active" : ""} >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>


      {viewMode === "list" && (
        <div className="list">
          {entries.map(([k, v]) => (
            <div className="row" key={k}>
              <div className="key">
                 {capitalize(k)}
                <div className="sub">{k.toLowerCase()}</div>
              </div>
              <div className="value">{renderValue(v, k)}</div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "card" && (
        <div className="grid">
          {entries.map(([k, v]) => (
            <div className="card" key={k}>
              <div className="card-title"> {capitalize(k)}</div>
              <div className="value">{renderValue(v, k)}</div>
            </div>
          ))}
        </div>
      )}

      
      {viewMode === "table" && (
        <table className="table">
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td className="key"> {capitalize(k)}</td>
                <td>{renderValue(v, k)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SmartDataViewer;