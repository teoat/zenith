import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingDown, AlertCircle, Activity, Wallet, CreditCard } from 'lucide-react';
import { reportingService } from '@/services/reporting';
import type { FinancialHealthData } from '@/types/api';
import { useProjectStore } from '@/store/projectStore';
import { secureLogger } from '@/utils/secureLogger';


const FinancialHealth = () => {
  const { activeProjectId } = useProjectStore();
  const [data, setData] = useState<FinancialHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simulator State
  const [simulatedBurnRate, setSimulatedBurnRate] = useState(15);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using dynamic activeProjectId
        const health = await reportingService.getFinancialHealth(activeProjectId || 'CASE-001');
        setData(health);
        setSimulatedBurnRate(health.burnRate || 15);
      } catch (err) {
        secureLogger.error("Failed to fetch financial health:", err);
        // Fallback to mock data if API fails (for demo resilience)
        setData({
            caseId: 'CASE-001',
            budget: 5000000,
            totalSpend: 2500000,
            suspiciousFlow: 450000,
            burnRate: 15,
            projectedRunway: 8,
            waterfall: [
                { name: 'Initial', amount: 5000000, type: 'positive' },
                { name: 'Materials', amount: -1200000, type: 'negative' },
                { name: 'Labor', amount: -800000, type: 'negative' },
                { name: 'Suspicious', amount: -450000, type: 'suspicious' },
                { name: 'Remaining', amount: 2500000, type: 'balance' }
            ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculated values based on simulation
  const simulatorResults = useMemo(() => {
    if (!data) return { runway: 0, endDate: '' };
    
    // Formula: Remaining Budget / (Monthly Spend * (Rate/100))
    // Simplified: Current Runway * (Original Rate / New Rate)
    const originalRate = data.burnRate || 15;
    // Avoid division by zero
    const rate = simulatedBurnRate < 1 ? 1 : simulatedBurnRate;
    const factor = originalRate / rate;
    const projectedRunwayMonths = (data.projectedRunway || 6) * factor; // simplified logic
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + projectedRunwayMonths);
    
    return {
        runway: projectedRunwayMonths.toFixed(1),
        endDate: endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }, [data, simulatedBurnRate]);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading financial analysis...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Project Budget</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${(data.budget / 1000000).toFixed(1)}M
              </h3>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                 <Activity size={12} className="mr-1"/> 100% Funded
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Actual Spend</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${(data.totalSpend / 1000000).toFixed(2)}M
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {(data.totalSpend / data.budget * 100).toFixed(1)}% of Budget
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
                (data.totalSpend / data.budget) > 0.8 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
            }`}>
              <TrendingDown size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-1 ring-orange-100 dark:ring-orange-900/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Suspicious Flow</p>
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">
                 ${(data.suspiciousFlow / 1000).toFixed(0)}k
              </h3>
              <p className="text-xs text-orange-600/80 mt-1 font-medium">
                 Requires Review
              </p>
            </div>
            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Sources (Bank) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Wallet size={18} className="text-indigo-500" />
                    Bank Statements
                </h3>
                <span className="text-xs font-mono text-slate-400">SOURCE OF FUNDS</span>
             </div>
             <div className="p-6 space-y-4">
                {(data?.inflowCategories || []).map(cat => (
                    <div key={cat.id} className="group">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                            <span className={`font-mono ${cat.amount < 0 ? 'text-slate-500' : 'text-green-600'}`}>
                                {cat.amount > 0 ? '+' : ''}${(cat.amount / 1000).toFixed(0)}k
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${
                                    cat.type === 'excluded' ? 'bg-slate-300 dark:bg-slate-600 pattern-diagonal' : 
                                    cat.type === 'inflow' ? 'bg-green-500' : 'bg-indigo-500'
                                }`} 
                                style={{ width: `${cat.percentage}%` }}
                            />
                        </div>
                        {cat.type === 'excluded' && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <Activity size={10} /> Excluded from project calculation (Internal Transfer)
                            </p>
                        )}
                    </div>
                ))}
             </div>
          </div>

          {/* Right: Uses (Expenses) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CreditCard size={18} className="text-rose-500" />
                    Expense Breakdown
                </h3>
                <span className="text-xs font-mono text-slate-400">OUTFLOW CATEGORIES</span>
             </div>
             <div className="p-6 space-y-4">
                {(data?.outflowCategories || []).map(cat => (
                    <div key={cat.id} className="group">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                                ${(cat.amount / 1000).toFixed(0)}k
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${
                                    cat.type === 'personal' ? 'bg-rose-400 opacity-60' : 
                                    cat.type === 'project' ? 'bg-blue-600' : 'bg-slate-500'
                                }`} 
                                style={{ width: `${cat.percentage}%` }}
                            />
                        </div>
                        {cat.type === 'personal' && (
                             <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                <AlertCircle size={10} /> Personal Expense Detected
                            </p>
                        )}
                    </div>
                ))}
            </div>
             <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                 <span className="text-sm font-bold text-blue-800 dark:text-blue-300">True Project Cost</span>
                 <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                     $2.55M
                 </span>
             </div>
          </div>
      </div>

      {/* Waterfall & Burn Rate Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Funds Waterfall</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.waterfall}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(51, 65, 85, 0.1)' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {data.waterfall.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={
                            entry.type === 'positive' ? '#22c55e' : 
                            entry.type === 'balance' ? '#3b82f6' : 
                            entry.type === 'suspicious' ? '#f97316' : '#94a3b8'
                            } 
                        />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Dynamic Simulator */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={120} />
            </div>
            
            <h3 className="text-lg font-bold mb-2 z-10">Burn Rate Simulator</h3>
            <p className="text-sm text-slate-400 mb-8 z-10">
                Simulate spending changes to forecast project runway.
            </p>
            
            <div className="flex-1 z-10">
                 <div className="text-center mb-8">
                     <p className="text-sm text-slate-400 mb-1">Projected Zero Funds Date</p>
                     <p className={`text-2xl font-bold ${
                         Number(simulatorResults.runway) < 3 ? 'text-red-400' : 'text-emerald-400'
                     }`}>
                         {simulatorResults.endDate}
                     </p>
                     <p className="text-xs text-slate-500 mt-1">
                         (~{simulatorResults.runway} months remaining)
                     </p>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label htmlFor="spending-velocity" className="text-xs font-bold uppercase tracking-wider text-slate-500">Spending Velocity</label>
                        <span className="text-xl font-bold text-blue-400">{simulatedBurnRate}%</span>
                    </div>
                    <input 
                        id="spending-velocity"
                        type="range" 
                        min="5" 
                        max="50"
                        step="1" 
                        value={simulatedBurnRate} 
                        onChange={(e) => setSimulatedBurnRate(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Conservative (5%)</span>
                        <span>Aggressive (50%)</span>
                    </div>
                 </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 z-10">
                <button 
                  onClick={() => setSimulatedBurnRate(data.burnRate)}
                  className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                    Reset to Actual ({data.burnRate}%)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
export default FinancialHealth;
