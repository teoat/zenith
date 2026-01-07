import React, { useState, useEffect } from "react";
import { useAIContext } from "@/context/AIContext";
import { X, Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipContext {
  userRole?: string;
  currentPage?: string;
  hasCompletedTutorial?: boolean;
  interactionCount?: number;
}

interface Props {
  id: string;
  trigger: "hover" | "mount" | "context";
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  contextFilter?: (context: TooltipContext) => boolean;
}

export const JustInTimeTooltip: React.FC<Props> = ({
  id,
  trigger,
  content,
  children,
  position = "top",
  contextFilter,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(`jit_tooltip_${id}`);
    }
    return false;
  });
  const { context } = useAIContext();

  useEffect(() => {
    if (trigger === "mount" && !hasBeenDismissed) {
      if (!contextFilter || contextFilter(context)) {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [id, trigger, context, contextFilter, hasBeenDismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem(`jit_tooltip_${id}`, "true");
  };

  if (hasBeenDismissed && trigger === "mount") {
    return <>{children}</>;
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => trigger === "hover" && setIsVisible(true)}
      onMouseLeave={() => trigger === "hover" && setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
              absolute z-50 w-64 p-3 bg-blue-600 text-white rounded-xl shadow-xl
              ${positionClasses[position]}
            `}
          >
            <div className="flex items-start gap-2">
              <Lightbulb
                size={16}
                className="mt-0.5 flex-shrink-0 text-yellow-300"
              />
              <p className="text-xs leading-relaxed flex-1">{content}</p>
              <button
                onClick={handleDismiss}
                className="text-blue-200 hover:text-white"
                aria-label="Dismiss tooltip"
                title="Dismiss tooltip"
              >
                <X size={14} />
              </button>
            </div>

            {/* Arrow */}
            <div
              className={`
                absolute w-3 h-3 bg-blue-600 transform rotate-45
                ${position === "top" ? "bottom-[-6px] left-1/2 -translate-x-1/2" : ""}
                ${position === "bottom" ? "top-[-6px] left-1/2 -translate-x-1/2" : ""}
                ${position === "left" ? "right-[-6px] top-1/2 -translate-y-1/2" : ""}
                ${position === "right" ? "left-[-6px] top-1/2 -translate-y-1/2" : ""}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
