import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface Case {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "pending_review" | "closed";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface CaseStore {
  cases: Case[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCases: () => Promise<void>;
  createCase: (
    caseData: Omit<Case, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Case>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<Case>;
  deleteCase: (id: string) => Promise<void>;
  getCase: (id: string) => Case | undefined;
  setCases: (cases: Case[]) => void;
}

export const useCaseStore = create<CaseStore>()(
  devtools(
    persist(
      (set, get) => ({
        cases: [],
        loading: false,
        error: null,

        fetchCases: async () => {
          set({ loading: true, error: null });
          try {
            // Mock implementation - in real app this would call an API
            const mockCases: Case[] = [
              {
                id: "1",
                title: "Sample Case",
                description: "A sample case for testing",
                priority: "medium",
                status: "open",
                assignedTo: "investigator@example.com",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: ["test", "sample"],
              },
            ];
            set({ cases: mockCases, loading: false });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch cases",
              loading: false,
            });
          }
        },

        createCase: async (caseData) => {
          const newCase: Case = {
            ...caseData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({ cases: [...state.cases, newCase] }));
          return newCase;
        },

        updateCase: async (id, updates) => {
          set((state) => ({
            cases: state.cases.map((case_) =>
              case_.id === id
                ? { ...case_, ...updates, updatedAt: new Date().toISOString() }
                : case_,
            ),
          }));

          const updatedCase = get().cases.find((c) => c.id === id);
          if (!updatedCase) {
            throw new Error("Case not found");
          }
          return updatedCase;
        },

        deleteCase: async (id) => {
          set((state) => ({
            cases: state.cases.filter((case_) => case_.id !== id),
          }));
        },

        getCase: (id) => {
          return get().cases.find((case_) => case_.id === id);
        },

        setCases: (cases) => {
          set({ cases });
        },
      }),
      {
        name: "case-store",
      },
    ),
    {
      name: "case-store",
    },
  ),
);
