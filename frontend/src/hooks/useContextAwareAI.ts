import { useEffect } from "react";
import { useAIContext } from "@/context/AIContext";

export function useContextAwareAI(page: string, data?: any) {
  const { setContext } = useAIContext();

  useEffect(() => {
    setContext({
      currentPage: page,
      activeData: data || null,
      timestamp: Date.now(),
    });
  }, [page, data, setContext]);
}
