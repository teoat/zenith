import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  placement?: "top" | "bottom" | "left" | "right";
}

interface TourContextType {
  currentStep: number | null;
  steps: TourStep[];
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  isActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);

  const tours: Record<string, TourStep[]> = {
    "dashboard-intro": [
      {
        id: "welcome",
        title: "Welcome to Zenith!",
        description:
          "This is your command center for fraud detection and investigation.",
        target: '[data-tour="dashboard-header"]',
        placement: "bottom",
      },
      {
        id: "metrics",
        title: "Key Metrics",
        description:
          "Monitor your fraud detection performance with these real-time metrics.",
        target: '[data-tour="metrics-grid"]',
        placement: "top",
      },
      {
        id: "threat-map",
        title: "Threat Map",
        description:
          "Visualize fraud patterns and hotspots across your network.",
        target: '[data-tour="threat-map"]',
        placement: "left",
      },
      {
        id: "ai-watchtower",
        title: "AI Watchtower",
        description: "Get AI-powered insights and anomaly detection alerts.",
        target: '[data-tour="ai-watchtower"]',
        placement: "right",
      },
    ],
    "cases-intro": [
      {
        id: "cases-view",
        title: "Case Management",
        description:
          "Organize and track all your fraud investigations in one place.",
        target: '[data-tour="cases-toolbar"]',
        placement: "bottom",
      },
      {
        id: "kanban-board",
        title: "Investigation Pipeline",
        description:
          "Move cases through different stages: Incoming, In Review, and Closed.",
        target: '[data-tour="kanban-board"]',
        placement: "top",
      },
    ],
    "graph-navigation": [
      {
        id: "force-layout",
        title: "Force Layout Graph",
        description:
          "Explore relationships between entities using our interactive network graph.",
        target: '[data-tour="network-graph"]',
        placement: "top",
      },
      {
        id: "graph-controls",
        title: "Graph Controls",
        description:
          "Zoom, pan, and filter the graph to focus on specific connections.",
        target: '[data-tour="graph-controls"]',
        placement: "right",
      },
    ],
  };

  const startTour = (tourId: string) => {
    const tourSteps = tours[tourId];
    if (tourSteps) {
      setSteps(tourSteps);
      setCurrentTourId(tourId);
      setCurrentStep(0);
    }
  };

  const nextStep = () => {
    if (currentStep !== null && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const endTour = () => {
    setCurrentStep(null);
    setCurrentTourId(null);
    setSteps([]);
  };

  // Auto-start tours for new users
  useEffect(() => {
    const hasSeenDashboardTour = localStorage.getItem(
      "tour-seen-dashboard-intro",
    );
    if (!hasSeenDashboardTour) {
      // Delay to allow components to mount
      setTimeout(() => startTour("dashboard-intro"), 2000);
    }
  }, []);

  // Mark tour as seen when completed
  useEffect(() => {
    if (currentTourId && currentStep === null) {
      localStorage.setItem(`tour-seen-${currentTourId}`, "true");
    }
  }, [currentTourId, currentStep]);

  const value: TourContextType = {
    currentStep,
    steps,
    startTour,
    nextStep,
    prevStep,
    endTour,
    isActive: currentStep !== null,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
