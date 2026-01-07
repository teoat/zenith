import React, { useState } from "react";
import { Bot, X, Sparkles } from "lucide-react";

interface WelcomeMessageProps {
  onDismiss?: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onDismiss }) => {
  // Initialize visibility based on localStorage to avoid setState in useEffect
  const [isVisible, setIsVisible] = useState(() => {
    const hasSeenWelcome = localStorage.getItem("welcome-seen");
    return !hasSeenWelcome;
  });
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    {
      title: "👋 Welcome, Investigator!",
      content:
        "I'm your Senior Partner AI. I'm here to help you navigate the complex world of fraud detection. Let's get you started with some quick tips.",
      suggestions: [
        "Start by creating your first case in the Cases section",
        "Upload evidence files to build your investigation",
        "Explore the Network Graph to visualize connections",
      ],
    },
    {
      title: "🎯 Quick Start Guide",
      content:
        "Based on your role, here are the most important features you'll use:",
      suggestions: [
        "Dashboard: Monitor real-time alerts and metrics",
        "Cases: Manage your investigations and evidence",
        "Network Analysis: Visualize fraud patterns and relationships",
        "Forensics: Analyze documents and digital evidence",
      ],
    },
    {
      title: "💡 Pro Tips",
      content:
        "Here are some advanced features that will make you more effective:",
      suggestions: [
        "Use the AI Watchtower for automated anomaly detection",
        "Leverage the relationship graph to find hidden connections",
        "Set up alerts for suspicious patterns in your data",
        "Collaborate with team members using the built-in tools",
      ],
    },
  ];

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("welcome-seen", "true");
    onDismiss?.();
  };

  const handleNext = () => {
    if (currentMessage < messages.length - 1) {
      setCurrentMessage(currentMessage + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  const message = messages[currentMessage];

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{message.title}</h3>
              <p className="text-sm text-gray-600">Senior Partner AI</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss welcome message"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-700 mb-4">{message.content}</p>

        <div className="space-y-2 mb-4">
          {message.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">{suggestion}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentMessage ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            {currentMessage === messages.length - 1
              ? "Get Started"
              : "Next Tip"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
