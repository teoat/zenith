import React, { useState } from "react";
import "./SystemDiagnosticsCenter.css";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { RefreshCw } from "lucide-react";

import { useSystemDiagnostics } from "@/hooks/useSystemDiagnostics";
import { SystemOverviewCards } from "@/components/diagnostics/SystemOverviewCards";
import { SystemServicesTab } from "@/components/diagnostics/SystemServicesTab";
import { SystemPerformanceTab } from "@/components/diagnostics/SystemPerformanceTab";
import { SystemIssuesTab } from "@/components/diagnostics/SystemIssuesTab";

const SystemDiagnosticsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const {
    currentMetrics,
    serviceHealth,
    performanceHistory,
    diagnosticIssues,
    loading,
    autoRefresh,
    setAutoRefresh,
    loadDiagnosticsData,
    resolveIssue,
  } = useSystemDiagnostics();

  if (loading && !currentMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            System Diagnostics Center
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive system monitoring and health diagnostics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={
              autoRefresh ? "bg-green-50 text-green-700 border-green-200" : ""
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto Refresh {autoRefresh ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadDiagnosticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <SystemOverviewCards metrics={currentMetrics} />

      {/* Main Diagnostics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Health Status */}
          <Card>
            <CardHeader>
              <CardTitle>Service Health Status</CardTitle>
              <CardDescription>
                Real-time status of all system services and components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemServicesTab services={serviceHealth} />
            </CardContent>
          </Card>

          {/* Performance Summary - Reuse Performance Tab or a simplified version if intended. 
              The original code had a specific summary view here, but reusing components is cleaner. 
              For now, let's reuse the Performance Tab content but wrapped differently if needed,
              or just show the Performance Tab content directly.
              Let's use the explicit Performance Tab component for consistency.
           */}
          <SystemPerformanceTab
            performanceHistory={performanceHistory}
            currentMetrics={currentMetrics}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <SystemServicesTab services={serviceHealth} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <SystemPerformanceTab
            performanceHistory={performanceHistory}
            currentMetrics={currentMetrics}
          />
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <SystemIssuesTab issues={diagnosticIssues} onResolve={resolveIssue} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemDiagnosticsCenter;
