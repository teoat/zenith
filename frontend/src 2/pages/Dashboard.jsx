import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  FolderOpen
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Cases',
      value: '1,247',
      change: '+12.5%',
      changeType: 'positive',
      icon: FolderOpen,
    },
    {
      title: 'Active Investigations',
      value: '89',
      change: '+5.2%',
      changeType: 'positive',
      icon: Activity,
    },
    {
      title: 'Fraud Detected',
      value: '$2.4M',
      change: '+18.7%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      title: 'Pending Reviews',
      value: '23',
      change: '-8.1%',
      changeType: 'negative',
      icon: Clock,
    },
  ];

  const recentCases = [
    { id: 'CASE-2024-001', type: 'Credit Card Fraud', risk: 'High', status: 'Investigating', amount: '$15,420' },
    { id: 'CASE-2024-002', type: 'Identity Theft', risk: 'Medium', status: 'Pending Review', amount: '$8,750' },
    { id: 'CASE-2024-003', type: 'Money Laundering', risk: 'High', status: 'Escalated', amount: '$125,000' },
    { id: 'CASE-2024-004', type: 'Account Takeover', risk: 'Low', status: 'Closed', amount: '$2,340' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold title-gradient">Dashboard</h1>
        <p className="text-secondary-400 mt-2">Welcome back! Here's your fraud detection overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card metric-card"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="w-6 h-6 text-primary-400" />
              <div className={`metric-change ${stat.changeType}`}>
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="metric-value">{stat.value}</div>
            <div className="metric-label">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-primary">Recent Cases</h2>
          <button className="btn btn-primary">View All Cases</button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map((case_) => (
                <tr key={case_.id}>
                  <td className="font-medium">{case_.id}</td>
                  <td>{case_.type}</td>
                  <td>
                    <span className={`status-badge ${
                      case_.risk === 'High' ? 'error' :
                      case_.risk === 'Medium' ? 'warning' : 'success'
                    }`}>
                      {case_.risk}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      case_.status === 'Closed' ? 'success' :
                      case_.status === 'Escalated' ? 'error' :
                      case_.status === 'Investigating' ? 'warning' : 'info'
                    }`}>
                      {case_.status}
                    </span>
                  </td>
                  <td className="font-medium">{case_.amount}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 text-center cursor-pointer"
        >
          <AlertTriangle className="w-8 h-8 text-warning-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Report Suspicious Activity</h3>
          <p className="text-sm text-secondary-400">Submit a new fraud case for investigation</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 text-center cursor-pointer"
        >
          <CheckCircle className="w-8 h-8 text-success-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Review Queue</h3>
          <p className="text-sm text-secondary-400">Check pending adjudication cases</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 text-center cursor-pointer"
        >
          <Users className="w-8 h-8 text-primary-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Team Collaboration</h3>
          <p className="text-sm text-secondary-400">Connect with fraud analysts</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;