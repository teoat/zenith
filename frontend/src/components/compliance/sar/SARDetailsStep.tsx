import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { SARFormData, SUSPICIOUS_ACTIVITY_TYPES, REGULATORY_BASES } from '@/types/sar';
import { Case } from '@/types/schema';

interface SARDetailsStepProps {
  formData: SARFormData;
  setFormData: React.Dispatch<React.SetStateAction<SARFormData>>;
  selectedCase: Case | null;
  setStep: (step: number) => void;
  handleActivityToggle: (activity: string) => void;
}

export const SARDetailsStep: React.FC<SARDetailsStepProps> = ({
  formData,
  setFormData,
  selectedCase,
  setStep,
  handleActivityToggle
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">SAR Details</h2>
        <p className="text-gray-600 mt-2">Provide detailed information for the Suspicious Activity Report</p>
      </div>

      {selectedCase && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linked Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedCase.title}</h3>
                <p className="text-sm text-gray-500">Case ID: {selectedCase.id}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Change Case
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Total Transaction Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.transaction_amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, transaction_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="count">Number of Transactions</Label>
              <Input
                id="count"
                type="number"
                value={formData.transaction_count}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, transaction_count: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Geographic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Primary Geographic Location</Label>
              <Input
                id="location"
                value={formData.geographic_location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, geographic_location: e.target.value }))}
                placeholder="City, State/Country"
              />
            </div>
            <div>
              <Label htmlFor="parties">Involved Parties (comma-separated)</Label>
              <Input
                id="parties"
                value={formData.involved_parties.join(', ')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  involved_parties: e.target.value.split(',').map((p: string) => p.trim()).filter((p: string) => p)
                }))}
                placeholder="Party names or identifiers"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Suspicious Activities
          </CardTitle>
          <CardDescription>Select all activities that apply to this case</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUSPICIOUS_ACTIVITY_TYPES.map((activity) => (
              <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.suspicious_activities.includes(activity)}
                  onChange={() => handleActivityToggle(activity)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{activity}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regulatory Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="basis">Regulatory Basis</Label>
            <Select value={formData.regulatory_basis} onValueChange={(value) => setFormData(prev => ({ ...prev, regulatory_basis: value }))}>
              <SelectTrigger title="Regulatory basis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGULATORY_BASES.map((basis) => (
                  <SelectItem key={basis} value={basis}>{basis}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="risk">Risk Level</Label>
            <Select value={formData.risk_level} onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value as "low" | "medium" | "high" | "critical" }))}>
              <SelectTrigger title="Risk level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deadline">Filing Deadline (days)</Label>
            <Input
              id="deadline"
              type="number"
              value={formData.deadline_days}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, deadline_days: parseInt(e.target.value) || 30 }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed description of the suspicious activity..."
              rows={4}
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.additional_notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              placeholder="Any additional context or notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
