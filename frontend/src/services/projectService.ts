import { request } from "./client";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return request("/projects");
  },

  createProject: async (
    name: string,
    description?: string,
  ): Promise<Project> => {
    return request("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  getProject: async (projectId: string): Promise<Project> => {
    return request(`/projects/${projectId}`);
  },
};
