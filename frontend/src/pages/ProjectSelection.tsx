import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/Button";
import { projectService } from "@/services/projectService";
import {
  FolderPlus,
  Folder,
  ArrowRight,
  Shield,
  Lock,
  Clock,
  Cpu,
  Plus,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

const BackgroundGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-[100px]" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-screen" />
  </div>
);

const ProjectCard = ({
  project,
  onClick,
  index,
}: {
  project: any;
  onClick: () => void;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.2 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <div
        onClick={onClick}
        className="group relative h-full flex flex-col p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] hover:border-blue-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 group-hover:border-blue-500/30 transition-all duration-300 shadow-inner">
            <Folder className="h-6 w-6" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
              Active
            </span>
          </div>
        </div>

        <div className="relative z-10 mb-auto">
          <h3 className="text-xl font-bold text-slate-100 mb-1 group-hover:text-blue-200 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 font-mono">
            ID: {project.id.substring(0, 8)}...
          </p>
        </div>

        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5"
              title="Encrypted Environment"
            >
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>AES-256</span>
            </div>
            <div className="flex items-center gap-1.5" title="Last Updated">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "Just now"}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
};

const CreateProjectCard = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4 }}
    onClick={onClick}
    className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)] transition-all duration-300 group text-center"
  >
    <div className="p-4 rounded-full bg-slate-800/50 mb-4 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300">
      <Plus className="h-8 w-8 text-slate-400 group-hover:text-blue-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-300 group-hover:text-white transition-colors">
      Initialize New Operation
    </h3>
    <p className="text-slate-500 text-sm mt-2 max-w-[200px]">
      Create a secure, isolated container for a new investigation.
    </p>
  </motion.button>
);

const CreateProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  value,
  onChange,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  value: string;
  onChange: (val: string) => void;
  isLoading: boolean;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
        >
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

            <form onSubmit={onSubmit} className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <FolderPlus className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    New Investigation
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Initialize a secure workspace container.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Operation Codename
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="e.g. PROJECT_CHIMERA"
                      disabled={isLoading}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent font-mono transition-all disabled:opacity-50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {value.length > 0 && !isLoading && (
                        <span className="text-xs text-emerald-500 font-mono">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex gap-3">
                  <Shield className="h-5 w-5 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This project will be created in an isolated environment with
                    full audit logging enabled. All evidence artifacts will be
                    encrypted at rest.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-slate-400 hover:text-white"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 border-0"
                  disabled={!value.trim() || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      Initializing...
                    </span>
                  ) : (
                    "Initialize Workspace"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const ProjectSelection: React.FC = () => {
  const { projects, setActiveProject, addProject, setProjects } =
    useProjectStore();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setInitializing(false);
      }
    };

    fetchProjects();
  }, [setProjects]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreating) setNewProjectName("");
  }, [isCreating]);

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    navigate("/");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const newProject = await projectService.createProject(newProjectName);
      addProject(newProject);
      setActiveProject(newProject.id);
      navigate("/");
    } catch (error) {
      console.error("Error creating project:", error);
      // Here you might want to show a toast error
    } finally {
      setLoading(false);
      setIsCreating(false);
    }
  };

  if (initializing && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative font-sans text-slate-200">
        <BackgroundGrid />
        <div className="z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
            Initializing Secure Environment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative font-sans text-slate-200 overflow-x-hidden">
      <BackgroundGrid />

      {/* Top Navigation Bar Placeholder (Cosmetic) */}
      <div className="w-full h-16 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md fixed top-0 z-40 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-lg tracking-tight text-white">
            ZENITH<span className="text-slate-600">.AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            SYSTEM ONLINE
          </span>
          <span>V 2.4.0-RC</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-24 z-10">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-medium text-slate-400 mb-6">
                <Cpu className="h-3 w-3 text-blue-500" />
                <span>Secure Access Gateway</span>
              </div>
              <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                Select{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Workspace
                </span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                Access your active forensic investigations or initialize a new
                secure environment for evidence processing.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="text-right hidden md:block">
                <div className="text-2xl font-bold text-white">
                  {projects.length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  Active Cases
                </div>
              </div>
              <div className="w-px h-12 bg-slate-800 hidden md:block" />
              <div className="text-right hidden md:block">
                <div className="text-2xl font-bold text-emerald-400">100%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  System Health
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card - Always First */}
            <CreateProjectCard onClick={() => setIsCreating(true)} />

            {/* Existing Projects */}
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onClick={() => handleSelectProject(project.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center z-10">
        <p className="text-slate-600 text-xs font-mono">
          UNAUTHORIZED ACCESS IS PROHIBITED • TERMINAL ID:{" "}
          {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </footer>

      <CreateProjectModal
        isOpen={isCreating}
        onClose={() => !loading && setIsCreating(false)}
        onSubmit={handleCreateProject}
        value={newProjectName}
        onChange={setNewProjectName}
        isLoading={loading}
      />
    </div>
  );
};

export default ProjectSelection;
