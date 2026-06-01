import React, { useEffect, useMemo, useState } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./LoaderComponent.css";

type LoaderState =
  | "loading"
  | "success"
  | "error"
  | "empty";

type LoaderType =
  | "spinner"
  | "progress"
  | "steps"
  | "tableSkeleton"
  | "dashboardSkeleton"
  | "formSkeleton";

type SpinnerStyle =
  | "circle"
  | "dualRing"
  | "pulse"
  | "bars"
  | "ripple"
  | "heartbeat"
  | "cubeGrid"
  | "triangle"
  | "wave"
  | "dots";

interface StepItem {
  label: string;
  completed?: boolean;
}

export const LoaderComponent: React.FC = () => {
  const [loaderStateInput] =
    Retool.useStateString({
      name: "loaderStateInput",
      label: "Loader State",
      description:
        "Bind dynamic value like {{query.isFetching ? 'loading' : 'success'}}",
      initialValue: "loading"
    });

  const [loaderType] =
    Retool.useStateEnumeration({
      name: "loaderType",
      enumDefinition: [
        "spinner",
        "progress",
        "steps",
        "tableSkeleton",
        "dashboardSkeleton",
        "formSkeleton"
      ],
      initialValue: "spinner",
      enumLabels: {
        spinner: "Spinner",
        progress: "Progress",
        steps: "Steps",
        tableSkeleton: "Table Skeleton",
        dashboardSkeleton: "Dashboard Skeleton",
        formSkeleton: "Form Skeleton"
      },
      inspector: "select",
      label: "Loader Type",
      description:
        "Choose loader style"
    });

  const [theme] = Retool.useStateEnumeration({
    name: "theme",
    label: "Theme",
    description:
      "Choose light, dark or auto theme",
    inspector: "select",
    initialValue: "auto",
    enumDefinition: [
      "auto",
      "light",
      "dark"
    ],
    enumLabels: {
      auto: "Auto",
      light: "Light",
      dark: "Dark"
    }
  });

  const [overlayMode] = Retool.useStateEnumeration({
    name: "overlayMode",
    label: "Display Mode",
    description:
      "Choose how the loader is displayed",
    inspector: "select",
    initialValue: "inline",
    enumDefinition: [
      "inline",
      "overlay",
      "fullscreen"
    ],
    enumLabels: {
      inline: "Inline",
      overlay: "Overlay",
      fullscreen: "Fullscreen"
    }
  });

  const [title] = Retool.useStateString({
    name: "title",
    label: "Title",
    description:
      "Loader heading text",
    initialValue: "Loading Data"
  });

  const [subtitle] = Retool.useStateString({
    name: "subtitle",
    label: "Subtitle",
    description:
      "Loader description text",
    initialValue: "Please wait while data is loading..."
  });

  const [showProgress] = Retool.useStateBoolean({
    name: "showProgress",
    label: "Show Progress",
    description:
      "Display progress bar",
    inspector: "checkbox",
    initialValue: true
  });

  const [spinnerStyle] =
    Retool.useStateEnumeration({
      name: "spinnerStyle",
      label: "Spinner Style",
      description:
        "Choose spinner animation style",
      initialValue: "circle",
      inspector: "select",
      enumDefinition: [
        "circle",
        "dualRing",
        "pulse",
        "bars",
        "ripple",
        "heartbeat",
        "cubeGrid",
        "triangle",
        "wave",
        "dots"
      ],
      enumLabels: {
        circle: "Circle Loader",
        dualRing: "Dual Ring",
        pulse: "Pulse Loader",
        bars: "Bars Loader",
        ripple: "Ripple Loader",
        heartbeat: "Heartbeat",
        cubeGrid: "Cube Grid",
        triangle: "Triangle",
        wave: "Wave Loader",
        dots: "Rotating Dots"
      }
    });

  const [manualProgress] =
    Retool.useStateNumber({
      name: "progress",
      label: "Progress",
      description: "0 - 100",
      inspector: "text",
      initialValue: 0
    });

  const [errorMessage] = Retool.useStateString({
    name: "errorMessage",
    label: "Error Message",
    description:
      "Message shown when state is error",
    initialValue: "Failed to load data."
  });

  const [emptyMessage] = Retool.useStateString({
    name: "emptyMessage",
    label: "Empty Message",
    description:
      "Message shown when state is empty",
    initialValue: "No records found."
  });

  const [tips] =
    Retool.useStateArray({
      name: "tips",
      label: "Tips Array",
      description:
        "Array of rotating tips",
      inspector: "text"
    });

  const [steps] =
    Retool.useStateArray({
      name: "steps",
      label: "Steps",
      description:
        "Array of step objects",
      inspector: "text"
    });

  const [queryStates] =
    Retool.useStateObject({
      name: "queryStates",
      label: "Query Status Object",
      description:
        "Object used to calculate progress automatically",
      inspector: "text"
    });

  const [hideDelay] =
    Retool.useStateNumber({
      name: "hideDelay",
      label: "Hide Delay",
      description:
        "Milliseconds before loader hides",
      inspector: "text",
      initialValue: 3000
    });

  Retool.useComponentSettings({
    defaultWidth: 6,
    defaultHeight: 8,
  });

  const loaderState = (
    loaderStateInput || "loading"
  ).toLowerCase() as LoaderState;

  const spinnerStyleValue =
    spinnerStyle as SpinnerStyle;

  const [animatedProgress, setAnimatedProgress] =
    useState(0);

  const [loadingStartedAt] =
    useState(() => Date.now());

  const calculatedProgress =
    useMemo(() => {

      if (
        queryStates &&
        typeof queryStates === "object" &&
        Object.keys(queryStates).length > 0
      ) {

        const total =
          Object.keys(queryStates).length;

        const completed =
          Object.values(queryStates)
            .filter(Boolean).length;

        return Math.round(
          (completed / total) * 100
        );
      }

      if (
        manualProgress > 0
      ) {
        return Math.max(
          0,
          Math.min(
            100,
            manualProgress
          )
        );
      }

      if (
        loaderState === "loading"
      ) {
        return animatedProgress;
      }

      return 100;

    }, [
      queryStates,
      manualProgress,
      animatedProgress,
      loaderState
    ]);

  const [tipIndex, setTipIndex] =
    useState(0);

  const [isVisible, setIsVisible] =
    useState(true);

  useEffect(() => {

    if (
      !Array.isArray(tips) ||
      tips.length === 0
    ) return;

    const interval =
      setInterval(() => {

        setTipIndex((prev) =>
          (prev + 1) % tips.length
        );

      }, 3000);

    return () =>
      clearInterval(interval);

  }, [tips]);

  useEffect(() => {

    if (loaderState !== "loading") {
      return;
    }

    setAnimatedProgress(5);

    const interval = setInterval(() => {

      setAnimatedProgress(prev => {

        if (prev >= 90) {
          return 90;
        }

        const increment =
          prev < 30
            ? 3
            : prev < 60
              ? 2
              : 1;

        return Math.min(
          90,
          prev + increment
        );

      });

    }, 150);

    return () =>
      clearInterval(interval);

  }, [loaderState]);

  useEffect(() => {

    if (
      loaderState === "success" ||
      loaderState === "error" ||
      loaderState === "empty"
    ) {

      const MIN_LOADING_TIME = 1000;

      const elapsed =
        Date.now() - loadingStartedAt;

      const remaining =
        Math.max(
          0,
          MIN_LOADING_TIME - elapsed
        );

      const progressTimer =
        setTimeout(() => {

          setAnimatedProgress(100);

          const hideTimer =
            setTimeout(() => {
              setIsVisible(false);
            }, hideDelay);

          (window as any).__loaderHideTimer =
            hideTimer;

        }, remaining);

      return () => {

        clearTimeout(progressTimer);

        clearTimeout(
          (window as any).__loaderHideTimer
        );

      };
    }

    setIsVisible(true);

  }, [
    loaderState,
    hideDelay,
    loadingStartedAt
  ]);

  const rootClass = useMemo(() => {

    let cls = "loader-root";

    cls += ` ${theme}`;

    cls += ` ${overlayMode}`;

    return cls;

  }, [theme, overlayMode]);

  const renderSuccess = () => (
    <div className="state-card">

      <div className="success-icon">
        ✅
      </div>

      <h2>Success</h2>

      <p>
        Data loaded successfully.
      </p>

    </div>
  );
  const renderError = () => (
    <div className="state-card">

      <div className="error-icon">
        ❌
      </div>

      <h2>Error</h2>

      <p>{errorMessage}</p>

    </div>
  );

  const renderEmpty = () => (
    <div className="state-card">

      <div className="empty-icon">
        📭
      </div>

      <h2>No Data</h2>

      <p>{emptyMessage}</p>

    </div>
  );

  const renderSpinner = (
    small = false
  ) => {

    const cls =
      small
        ? "small"
        : "";

    switch (spinnerStyleValue) {

      case "dualRing":
        return (
          <div
            className={`spinner-dual-ring ${cls}`}
          />
        );

      case "pulse":
        return (
          <div
            className={`spinner-pulse ${cls}`}
          />
        );

      case "bars":
        return (
          <div
            className={`spinner-bars ${cls}`}
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        );

      case "ripple":
        return (
          <div
            className={`spinner-ripple ${cls}`}
          >
            <div />
            <div />
          </div>
        );

      case "heartbeat":
        return (
          <div
            className={`spinner-heart ${cls}`}
          />
        );

      case "cubeGrid":
        return (
          <div
            className={`spinner-grid ${cls}`}
          >
            {[...Array(9)].map(
              (_, i) => (
                <span key={i} />
              )
            )}
          </div>
        );

      case "triangle":
        return (
          <div
            className={`spinner-triangle ${cls}`}
          />
        );

      case "wave":
        return (
          <div
            className={`spinner-wave ${cls}`}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        );

      case "dots":
        return (
          <div
            className={`spinner-dots ${cls}`}
          >
            <span />
            <span />
            <span />
          </div>
        );

      default:
        return (
          <div
            className={`spinner ${cls}`}
          />
        );
    }
  };

  const renderSpinnerLoader = () => (
    <>
      {renderSpinner()}

      <h2>{title}</h2>

      <p>{subtitle}</p>

      {Array.isArray(tips) &&
        tips.length > 0 && (
          <div className="tip-box">
            💡 {tips[tipIndex]}
          </div>
        )}
    </>
  );

  const renderProgressLoader = () => (
    <>
      {renderSpinner(true)}

      <h2>{title}</h2>

      <p>{subtitle}</p>

      {showProgress && (
        <>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width:
                  `${calculatedProgress}%`
              }}
            />
          </div>

          <div className="progress-value">
            {calculatedProgress}%
          </div>
        </>
      )}
    </>
  );

  const renderStepsLoader = () => {

    const list =
      Array.isArray(steps)
        ? steps
        : [];

    return (
      <>
        {renderSpinner(true)}

        <h2>{title}</h2>

        <p>{subtitle}</p>

        <div className="steps-list">

          {list.map(
            (
              step: StepItem,
              index: number
            ) => (
              <div
                className={`step-row ${step.completed
                  ? "completed"
                  : ""
                  }`}
                key={index}
              >
                <span>
                  {step.completed
                    ? "✓"
                    : "○"}
                </span>

                <span>
                  {step.label}
                </span>
              </div>
            )
          )}

        </div>
      </>
    );
  };

  const renderTableSkeleton =
    () => (
      <div className="table-skeleton">
        {[...Array(8)].map(
          (_, i) => (
            <div
              key={i}
              className="table-row"
            />
          )
        )}
      </div>
    );

  const renderFormSkeleton =
    () => (
      <div className="form-skeleton">
        {[...Array(6)].map(
          (_, i) => (
            <div
              key={i}
              className="form-line"
            />
          )
        )}
      </div>
    );

  const renderDashboardSkeleton =
    () => (
      <div className="dashboard-skeleton">

        <div className="kpi-row">

          {[...Array(4)].map(
            (_, i) => (
              <div
                key={i}
                className="kpi-card"
              />
            )
          )}

        </div>

        <div className="chart-skeleton" />

        <div className="table-skeleton">
          {[...Array(5)].map(
            (_, i) => (
              <div
                key={i}
                className="table-row"
              />
            )
          )}
        </div>

      </div>
    );

  const renderLoadingContent =
    () => {

      switch (loaderType) {

        case "progress":
          return renderProgressLoader();

        case "steps":
          return renderStepsLoader();

        case "tableSkeleton":
          return renderTableSkeleton();

        case "dashboardSkeleton":
          return renderDashboardSkeleton();

        case "formSkeleton":
          return renderFormSkeleton();

        default:
          return renderSpinnerLoader();
      }
    };
  if (!isVisible) {
    return null;
  }
  return (
    <div
      className="loader-host"
    >
      <div
        className={rootClass}
      >

        <div className="loader-container">

          {loaderState === "loading" &&
            renderLoadingContent()}

          {loaderState === "success" &&
            renderSuccess()}

          {loaderState === "error" &&
            renderError()}

          {loaderState === "empty" &&
            renderEmpty()}

        </div>

      </div>
    </div>
  );
};

export default LoaderComponent;