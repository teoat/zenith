import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ServiceHealth } from "@/types/system-diagnostics";

interface SystemServicesTabProps {
  services: ServiceHealth[];
}

export const SystemServicesTab: React.FC<SystemServicesTabProps> = ({
  services,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "status-badge-healthy";
      case "degraded":
        return "status-badge-degraded";
      case "unhealthy":
        return "status-badge-unhealthy";
      case "offline":
        return "status-badge-offline";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {services.map((service, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <Badge className={getStatusColor(service.status)}>
                {service.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-lg font-semibold">
                  {service.response_time}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-semibold">
                  {service.uptime_percentage}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errors (24h)</p>
                <p className="text-lg font-semibold">{service.error_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Check</p>
                <p className="text-sm font-semibold">
                  {new Date(service.last_check).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
