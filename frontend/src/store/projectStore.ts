import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

interface ProjectState {
  activeProjectId: string | null;
  projects: Project[]; // Local cache of projects for the switcher
  setActiveProject: (id: string) => void;
  addProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      projects: [],
      setActiveProject: (id) => set({ activeProjectId: id }),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      setProjects: (projects) => set({ projects }),
      clearProject: () => set({ activeProjectId: null }),
    }),
    {
      name: 'project-storage',
    }
  )
);
