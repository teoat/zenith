import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTour } from "@/context/TourContext";

const TourSpotlight: React.FC = () => {
  const { currentStep, steps, nextStep, prevStep, endTour, isActive } =
    useTour();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || currentStep === null || !steps[currentStep]) {
      requestAnimationFrame(() => setTargetElement(null));
      return;
    }

    const step = steps[currentStep];
    const element = document.querySelector(step.target);

    // Use requestAnimationFrame to avoid sync setState in effect
    requestAnimationFrame(() => {
      setTargetElement(element);

      if (element) {
        const rect = element.getBoundingClientRect();
        const placement = step.placement || "bottom";

        let top = 0;
        let left = 0;

        switch (placement) {
          case "top":
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }

        setTooltipPosition({ top, left });
      }
    });
  }, [isActive, currentStep, steps]);

  if (
    !isActive ||
    currentStep === null ||
    !steps[currentStep] ||
    !targetElement
  ) {
    return null;
  }

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-none" />

      {/* Spotlight */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: targetElement.getBoundingClientRect().top - 8,
          left: targetElement.getBoundingClientRect().left - 8,
          width: targetElement.getBoundingClientRect().width + 16,
          height: targetElement.getBoundingClientRect().height + 16,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: "translate(-50%, 0)",
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{step.title}</h3>
          <button
            onClick={endTour}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">{step.description}</p>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {steps.map((_: any, index: number) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}

            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TourSpotlight;
