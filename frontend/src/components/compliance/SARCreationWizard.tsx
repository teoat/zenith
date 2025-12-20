import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Search,
  DollarSign,
  MapPin,
  Activity,
  Save,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '@/hooks/useCases';
import type { Case } from '@/types/schema'; // Assuming schema exists there, or just define a compatible one if needed.
// If type import fails, we can define a minimal interface compatible with what comes from useCases

interface SARFormData {
  case_id: string;
  suspicious_activities: string[];
  transaction_amount: number;
  transaction_count: number;
  description: string;
  involved_parties: string[];
  geographic_location: string;
  regulatory_basis: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  deadline_days: number;
  additional_notes: string;
}

const SARCreationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Use the useCases hook to fetch real cases
  const { data: casesData, isLoading: casesLoading, error: casesError } = useCases();
  const cases = casesData?.cases || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
     return () => {
         isMounted.current = false;
         if (timeoutRef.current) clearTimeout(timeoutRef.current);
     };
  }, []);

  const [formData, setFormData] = useState<SARFormData>({
    case_id: '',
    suspicious_activities: [],
    transaction_amount: 0,
    transaction_count: 0,
    description: '',
    involved_parties: [],
    geographic_location: '',
    regulatory_basis: 'BSA/AML - Suspicious Transaction Reporting',
    risk_level: 'medium',
    deadline_days: 30,
    additional_notes: ''
  });

  const suspiciousActivityTypes = [
    'Structuring',
    'Money Laundering',
    'Terrorist Financing',
    'Fraud',
    'Identity Theft',
    'Smurfing',
    'Unusual Transaction Patterns',
    'High-Risk Geographic Areas',
    'PEP Involvement',
    'Sanctions Evasion',
    'Unexplained Wealth',
    'Cash Intensive Business'
  ];

  const regulatoryBases = [
    'BSA/AML - Suspicious Transaction Reporting',
    'PATRIOT Act - Section 314(a)',
    'OFAC Sanctions',
    'EU AML Directive 5',
    'FATF Recommendations',
    'Local AML Regulations'
  ];

  const filteredCases = cases.filter(case_ =>
    (case_.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (case_.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleCaseSelect = (case_: Case) => {
    setSelectedCase(case_);
    setFormData(prev => ({ ...prev, case_id: case_.id }));
    setStep(2);
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      suspicious_activities: prev.suspicious_activities.includes(activity)
        ? prev.suspicious_activities.filter(a => a !== activity)
        : [...prev.suspicious_activities, activity]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.case_id || !formData.description || formData.suspicious_activities.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the compliance API
      const response = await fetch('/api/v1/compliance/sar/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create SAR');
      }

      const result = await response.json();
      
      if (isMounted.current) {
        setSuccess(`SAR ${result.sar_id} has been created and queued for regulatory submission`);
        timeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            navigate('/compliance/monitoring');
          }
        }, 3000);
      }
    } catch {
      if (isMounted.current) {
        setError('Failed to create SAR. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Select Investigation Case</h2>
        <p className="text-gray-600 mt-2">Choose the case that prompted this SAR filing</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases by title or ID..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {casesLoading && <div className="p-4 text-center text-gray-500">Loading cases...</div>}
          
          {casesError && <div className="p-4 text-center text-red-500">Failed to load cases</div>}

          {!casesLoading && !casesError && filteredCases.length === 0 && (
             <div className="p-4 text-center text-gray-500">No cases found matching your search.</div>
          )}

          {!casesLoading && !casesError && filteredCases.map((case_) => (
            <Card
              key={case_.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCaseSelect(case_)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{case_.title}</h3>
                    <p className="text-sm text-gray-500">Case ID: {case_.id}</p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(case_.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      (case_.status as string).toLowerCase() === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {case_.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{case_.priority.toLowerCase()} priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
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
            {suspiciousActivityTypes.map((activity) => (
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
                {regulatoryBases.map((basis) => (
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SAR Creation Wizard</h1>
          <p className="text-gray-600 mt-2">Create a Suspicious Activity Report for regulatory filing</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm ${step === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            Step {step} of 2
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}

      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>

        <div className="flex space-x-3">
          {step === 1 && selectedCase && (
            <Button onClick={() => setStep(2)}>
              Next: SAR Details
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Creating SAR...' : 'Create & Submit SAR'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SARCreationWizard;