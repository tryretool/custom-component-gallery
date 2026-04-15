import React, { useState, useEffect } from "react";
import { Retool } from "@tryretool/custom-component-support";
import "./styles.css";

export const ImageCarousel = () => {
  const [imageUrls] = Retool.useStateArray({
    name: "imageUrls",
    label: "URLs",
    description:
      "List of image URLs to display in the carousel (array of strings)",
    initialValue: [],
  });

  const [scrollInterval] = Retool.useStateNumber({
    name: "scrollInterval",
    label: "Slide Interval (ms)",
    description:
      "Delay between automatic slide transitions in milliseconds (e.g., 3000 = 3 seconds)",
    initialValue: 3000,
  });

  const [autoPlay] = Retool.useStateBoolean({
    name: "autoPlay",
    label: "Auto Slide",
    description: "Enable or disable automatic sliding of images",
    inspector: "checkbox",
    initialValue: true,
  });

  const [showNavButtons] = Retool.useStateBoolean({
    name: "showNavButtons",
    label: "Show Navigation Buttons",
    description: "Toggle visibility of previous/next navigation buttons",
    inspector: "checkbox",
    initialValue: true,
  });

  const [showCounter] = Retool.useStateBoolean({
    name: "showCounter",
    label: "Show Slide Counter",
    description: "Toggle visibility of current slide number and total slides",
    inspector: "checkbox",
    initialValue: true,
  });

  const [animationType] = Retool.useStateEnumeration({
    name: "animationType",
    label: "Animation Style",
    description: "Choose the transition animation effect between slides",
    inspector: "select",
    initialValue: "slide",
    enumDefinition: [
      "slide",
      "fade",
      "zoom",
      "rotate",
      "blur",
      "slideFade",
      "skew",
      "none",
    ],
    enumLabels: {
      slide: "Slide",
      fade: "Fade",
      zoom: "Zoom",
      rotate: "Rotate",
      blur: "Blur",
      slideFade: "Slide + Fade",
      skew: "Skew",
      none: "No Animation",
    },
  });

  const [fitMode] = Retool.useStateEnumeration({
    name: "fitMode",
    label: "Image Size",
    description:
      "Controls how images are resized inside the container (cover = fill, contain = fit inside)",
    inspector: "select",
    initialValue: "cover",
    enumDefinition: ["cover", "contain"],
    enumLabels: {
      cover: "Cover",
      contain: "Contain",
    },
  });

  const [navPosition] = Retool.useStateEnumeration({
    name: "navPosition",
    label: "Navigation Position",
    description:
      "Select where navigation buttons should appear (side arrows or bottom buttons)",
    inspector: "select",
    initialValue: "side",
    enumDefinition: ["side", "bottom"],
    enumLabels: {
      side: "Side",
      bottom: "Bottom",
    },
  });

  Retool.useComponentSettings({
    defaultHeight: 50,
    defaultWidth: 6,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState("next");

  useEffect(() => {
    if (!autoPlay || !imageUrls.length) return;

    const timer = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
      setDirection("next");
    }, scrollInterval);

    return () => clearInterval(timer);
  }, [autoPlay, imageUrls.length, scrollInterval, currentIndex]);

  const goTo = (index, dir) => {
    if (index === currentIndex) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
    setDirection(dir);
  };

  if (!imageUrls.length) {
    return (
      <div className="carousel-container">
        <div className="empty-state">No images provided</div>
      </div>
    );
  }

  return (
    <div className="carousel-container">
      <div className="image-container">
        {imageUrls.map((url, index) => {
          let className = "slide";

          if (animationType === "none") {
            if (index === currentIndex) className += " active";
            else className += " hidden";
          } else if (animationType === "fade") {
            if (index === currentIndex) className += " fade-in";
            else if (index === prevIndex) className += " fade-out";
            else className += " hidden";
          } else if (animationType === "zoom") {
            if (index === currentIndex) className += " zoom-in";
            else if (index === prevIndex) className += " zoom-out";
            else className += " hidden";
          } else if (animationType === "rotate") {
            if (index === currentIndex) className += " rotate-in";
            else if (index === prevIndex) className += " rotate-out";
            else className += " hidden";
          } else if (animationType === "blur") {
            if (index === currentIndex) className += " blur-in";
            else if (index === prevIndex) className += " blur-out";
            else className += " hidden";
          } else if (animationType === "slideFade") {
            if (index === currentIndex) className += " slide-fade-in";
            else if (index === prevIndex) className += " slide-fade-out";
            else className += " hidden";
          } else if (animationType === "skew") {
            if (index === currentIndex) className += " skew-in";
            else if (index === prevIndex) className += " skew-out";
            else className += " hidden";
          } else {
            if (index === currentIndex) {
              className +=
                direction === "next" ? " active-next" : " active-prev";
            } else if (index === prevIndex) {
              className += direction === "next" ? " exit-next" : " exit-prev";
            } else {
              className += " hidden";
            }
          }

          return (
            <div key={index} className={className}>
              <img src={url} className="image" style={{ objectFit: fitMode }} />
            </div>
          );
        })}

        {showNavButtons && navPosition === "side" && (
          <>
            <button
              className="nav-button left"
              onClick={() =>
                goTo(
                  (currentIndex - 1 + imageUrls.length) % imageUrls.length,
                  "prev",
                )
              }
            >
              ‹
            </button>

            <button
              className="nav-button right"
              onClick={() =>
                goTo((currentIndex + 1) % imageUrls.length, "next")
              }
            >
              ›
            </button>
          </>
        )}

        {showNavButtons && navPosition === "bottom" && (
          <div className="bottom-nav">
            <button
              className="nav-button"
              onClick={() =>
                goTo(
                  (currentIndex - 1 + imageUrls.length) % imageUrls.length,
                  "prev",
                )
              }
            >
              ‹
            </button>

            <button
              className="nav-button"
              onClick={() =>
                goTo((currentIndex + 1) % imageUrls.length, "next")
              }
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="dots">
        {imageUrls.map((_, i) => (
          <span
            key={i}
            onClick={() => {
              const dir = i > currentIndex ? "next" : "prev";
              goTo(i, dir);
            }}
            className={`dot ${i === currentIndex ? "active" : ""}`}
          />
        ))}
      </div>

      {showCounter && (
        <div className="counter">
          {currentIndex + 1} / {imageUrls.length}
        </div>
      )}
    </div>
  );
};
