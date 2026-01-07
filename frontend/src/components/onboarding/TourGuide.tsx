import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface Step {
  title: string;
  description: string;
  image?: string;
  targetId?: string; // Optional: ID to highlight if we wanted to implement that later
}

export const defaultSteps: Step[] = [
  {
    title: "Welcome to Zenith",
    description:
      "Your advanced platform for fraud adjudication and financial intelligence.",
  },
  {
    title: "The Dashboard",
    description:
      "Customize your command center with widgets, track KPIs, and monitor system health in real-time.",
  },
  {
    title: "Case Management",
    description:
      'Navigate to "Cases" to view, filter, and adjudicate investigations using our Kanban or List views.',
  },
  {
    title: "Graph Intelligence",
    description:
      'Use the "Network" and "Investigation" tabs to visualize complex entity relationships in 3D.',
  },
  {
    title: "Compliance Suite",
    description:
      "Monitor regulatory changes and file SARs directly from the Compliance section.",
  },
];

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  steps?: Step[];
}

export const TourGuide: React.FC<TourGuideProps> = ({
  isOpen,
  onClose,
  onComplete,
  steps = defaultSteps,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <h2 className="text-xl font-semibold tracking-tight">
                  {steps[currentStep].title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="min-h-[120px] text-muted-foreground">
                {steps[currentStep].description}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-secondary rounded-full mt-6 overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 bg-muted/40 border-t">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="link"
                  onClick={onComplete}
                  className="text-muted-foreground"
                >
                  Skip Tour
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? (
                    <>
                      Get Started
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
