import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { Check, Building, Briefcase, Search } from 'lucide-react';
import { reportingService } from '../../services/reporting';
import { ProjectTrackerData } from '../../types/api';
import { useProjectStore } from '../../store/projectStore';

interface VendorOutlier {
    x: number;
    y: number;
    z: number;
    name: string;
    outlier?: boolean;
}

// Mock data for the Vendor Outlier scatter plot (missing from API type currently)
const VENDOR_OUTLIERS: VendorOutlier[] = [
    { x: 10, y: 300, z: 200, name: 'Vendor A (Normal)' },
    { x: 12, y: 320, z: 240, name: 'Vendor A' },
    { x: 50, y: 1500, z: 400, name: 'Vendor B (Outlier)', outlier: true },
    { x: 15, y: 400, z: 200, name: 'Vendor C' },
    { x: 20, y: 450, z: 100, name: 'Vendor D' },
    { x: 18, y: 420, z: 150, name: 'Vendor E' },
    { x: 45, y: 1400, z: 500, name: 'Shell Co? (High)', outlier: true },
];

const ProjectTracker = () => {
  const { activeProjectId } = useProjectStore();
  const [data, setData] = useState<ProjectTrackerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracker = async () => {
      try {
        const trackerData = await reportingService.getProjectTracker(activeProjectId || 'CASE-001');
        setData(trackerData);
      } catch (err) {
        console.error("Failed to load tracker", err);
        // Fallback mock
        setData({
            caseId: 'CASE-001',
            overallProgress: 65,
            milestones: [
                { id: '1', name: 'Foundation', status: 'complete', amount: 500000 },
                { id: '2', name: 'Structure', status: 'complete', amount: 750000 },
                { id: '3', name: 'MEP Install', status: 'delayed', amount: 450000 },
                { id: '4', name: 'Finishing', status: 'pending', amount: 300000 },
            ],
            benchmarks: [
                { category: 'Materials', project: 120, industry: 100 },
                { category: 'Labor', project: 145, industry: 100 },
                { category: 'Admin', project: 90, industry: 100 },
            ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTracker();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading tracker...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Milestone Stepper */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-blue-500" />
            Project Milestones
            </h3>
            <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                Overall Progress: {data.overallProgress}%
            </span>
        </div>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-0 top-5 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2" />
          <div className="relative flex justify-between z-10">
            {data.milestones.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all
                  ${step.status === 'complete' ? 'bg-green-500 border-green-100 text-white scale-110 shadow-sm' : 
                    step.status === 'delayed' ? 'bg-orange-500 border-orange-100 text-white' : 
                    'bg-white border-slate-200 text-slate-300 dark:bg-slate-800 dark:border-slate-700'}
                `}>
                  {step.status === 'complete' ? <Check size={16} /> : <span>{index + 1}</span>}
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{step.name}</p>
                  <p className="text-xs text-slate-500">${(step.amount/1000).toFixed(0)}k</p>
                  {step.status === 'delayed' && (
                    <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Delayed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peer Benchmarks */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
            <Building size={20} className="text-purple-500" />
            Peer Comparison (Index 100)
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Benchmark against regional construction averages.
            <span className="text-orange-500 font-bold ml-1">Values {'>'} 100 indicate likely overbilling.</span>
          </p>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.benchmarks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                <XAxis type="number" domain={[0, 160]} stroke="#94a3b8" />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="project" name="This Project" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} />
                <Bar dataKey="industry" name="Industry Avg" fill="#94a3b8" barSize={20} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Outlier Analysis (New) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
           <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Search size={20} className="text-rose-500" />
                    Vendor Price Analysis
                   </h3>
                   <p className="text-xs text-slate-400 mt-1">Price/Unit vs Total Volume. <span className="text-rose-500">Red dots are outliers.</span></p>
                </div>
                <button className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors dark:text-white">
                    View Data
                </button>
           </div>
           
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                    <XAxis type="number" dataKey="x" name="Volume" unit=" units" stroke="#94a3b8" fontSize={11} />
                    <YAxis type="number" dataKey="y" name="Price" unit="$" stroke="#94a3b8" fontSize={11} />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Total Value" />
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload as VendorOutlier;
                                return (
                                    <div className="bg-slate-800 text-white p-2 text-xs rounded shadow-lg border border-slate-700">
                                        <p className="font-bold mb-1">{d.name}</p>
                                        <p>Price: ${d.y}</p>
                                        <p>Volume: {d.x}</p>
                                        <p>Value: ${d.z}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="Vendors" data={VENDOR_OUTLIERS} fill="#3b82f6">
                        {VENDOR_OUTLIERS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.outlier ? '#f43f5e' : '#3b82f6'} />
                        ))}
                    </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
export default ProjectTracker;
