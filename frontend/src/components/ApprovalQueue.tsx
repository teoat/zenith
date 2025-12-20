import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AccessibleButton } from '@/components/ui/AccessibleButton';
import { approvalService, type PendingAction } from '@/services/approvalService';
import { secureLogger } from '@/utils/secureLogger';

interface ApprovalQueueProps {
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
}

const getImpactStyles = (impact: PendingAction['impact']) => {
  const styles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  return styles[impact] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  className = '',
  maxHeight = '400px',
  showHeader = true
}) => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    approvalService.getPendingActions().then(setPendingActions);
    return approvalService.addListener(setPendingActions);
  }, []);

  const handleApprove = async (actionId: string) => {
    try {
      await approvalService.approveAction(actionId);
      secureLogger.info('APPROVAL_QUEUE', `Action approved: ${actionId}`);
    } catch (error) {
      secureLogger.error('APPROVAL_QUEUE', `Failed to approve action: ${actionId}`, { error });
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      await approvalService.rejectAction(actionId, 'Rejected by user');
      secureLogger.info('APPROVAL_QUEUE', `Action rejected: ${actionId}`);
    } catch (error) {
      secureLogger.error('APPROVAL_QUEUE', `Failed to reject action: ${actionId}`, { error });
    }
  };


  if (pendingActions.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Approval Queue
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No pending actions requiring approval.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Approval Queue
              </div>
              <Badge variant="secondary">{pendingActions.length} pending</Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div 
            className="space-y-3 overflow-y-auto" 
            style={{ ['--max-height' as string]: maxHeight, maxHeight: 'var(--max-height)' } as React.CSSProperties}
          >
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon()}
                      <h4 className="font-medium text-sm truncate">{action.title}</h4>
                      <Badge className={`text-xs ${getImpactColor(action.impact)}`}>
                        {action.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{action.category}</span>
                      {action.confidence && (
                        <span>• {Math.round(action.confidence * 100)}% confidence</span>
                      )}
                      <span>• {action.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>



                <div className="flex gap-2">
                  <AccessibleButton
                    onClick={() => handleApprove(action.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex-1"
                    aria-label={`Approve ${action.title}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                    Approve
                  </AccessibleButton>
                  <AccessibleButton
                    onClick={() => handleReject(action.id)}
                    variant="secondary"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm flex-1"
                    aria-label={`Reject ${action.title}`}
                  >
                    <XCircle className="w-3 h-3 mr-1 inline" />
                    Reject
                  </AccessibleButton>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ApprovalQueue;