import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance';
import { useState } from 'react';

export const useComplianceDashboard = () => {
  const queryClient = useQueryClient();
  const [monitoringActive, setMonitoringActive] = useState(false);

  const { data: rules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['compliance', 'rules'],
    queryFn: () => complianceService.getComplianceRules()
  });

  const { data: checks = [], isLoading: isLoadingChecks } = useQuery({
    queryKey: ['compliance', 'checks'],
    queryFn: () => complianceService.getComplianceChecks()
  });

  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['compliance', 'alerts'],
    queryFn: () => complianceService.getRegulatoryAlerts()
  });

  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ['compliance', 'reports'],
    queryFn: () => complianceService.getComplianceReports()
  });

  const runCheckMutation = useMutation({
    mutationFn: ({ ruleId, entityId }: { ruleId: string; entityId: string }) =>
      complianceService.runComplianceCheck(ruleId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'checks'] });
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => complianceService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'alerts'] });
    }
  });

  const toggleMonitoring = () => {
    setMonitoringActive(!monitoringActive);
  };

  const isLoading = isLoadingRules || isLoadingChecks || isLoadingAlerts || isLoadingReports;

  return {
    rules,
    checks,
    alerts,
    reports,
    isLoading,
    monitoringActive,
    toggleMonitoring,
    runComplianceCheck: runCheckMutation.mutate,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    }
  };
};
