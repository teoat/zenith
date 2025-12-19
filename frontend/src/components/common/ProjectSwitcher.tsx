import React, { useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Folder } from 'lucide-react';


export const ProjectSwitcher: React.FC = () => {
  const { activeProjectId, projects, setActiveProject, setProjects } = useProjectStore();

  // Seed default project if none exist
  useEffect(() => {
    if (projects.length === 0) {
      setProjects([
        { id: 'proj_default', name: 'Operation Alpha' },
        { id: 'proj_beta', name: 'Project Beta' },
      ]);
      setActiveProject('proj_default');
    } else if (!activeProjectId && projects.length > 0) {
      setActiveProject(projects[0].id);
    }
  }, [projects.length, activeProjectId, setProjects, setActiveProject]);



  return (
    <div className="flex items-center gap-2 mr-4">
      <Select value={activeProjectId || ''} onValueChange={setActiveProject}>
        <SelectTrigger className="w-[180px] h-9 gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select Project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          {/* Future: Add 'Create Project' button here */}
        </SelectContent>
      </Select>
    </div>
  );
};
