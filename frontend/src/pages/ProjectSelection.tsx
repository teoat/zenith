import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FolderPlus, Folder, ArrowRight, Shield, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectSelection: React.FC = () => {
  const { projects, setActiveProject, addProject } = useProjectStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    navigate('/');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newId = `proj_${Date.now()}`;
    addProject({ id: newId, name: newProjectName });
    setActiveProject(newId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4"
          >
            <Shield className="h-10 w-10 text-blue-500" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Forensic Workspace Selection
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Select an active investigation or initialize a new secure project environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="group cursor-pointer bg-slate-900/40 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all duration-300 overflow-hidden"
                onClick={() => handleSelectProject(project.id)}
              >
                <CardHeader className="pb-3 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                      <Folder className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                    </div>
                    <Activity className="h-4 w-4 text-emerald-500 opacity-50" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-400 transition-colors">{project.name}</CardTitle>
                  <CardDescription className="text-slate-500">
                    Last activity: 2 hours ago
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Encrypted
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Local DB
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 justify-end">
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform dark:text-gray-200">
                    Open Workspace <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}

          {!isCreating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="h-full border-dashed border-slate-800 bg-transparent hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center p-8 group"
                onClick={() => setIsCreating(true)}
              >
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-4 group-hover:scale-110 transition-transform">
                  <FolderPlus className="h-8 w-8 text-slate-400 group-hover:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 group-hover:text-white">Initialize New Project</h3>
                <p className="text-slate-500 text-sm text-center mt-2">Create a secure, isolated sandbox for a new investigation.</p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="h-full bg-slate-900/40 border-blue-500/30 p-8">
                <form onSubmit={handleCreateProject} className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-white mb-4">Project Name</h3>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Operation Shadow"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-6"
                  />
                  <div className="flex gap-3 mt-auto">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 dark:text-gray-200" 
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Create Project
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="text-center opacity-40 text-xs text-slate-500">
          Securely managed by 378x492 Forensic Engine v1.0.0
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectSelection;
