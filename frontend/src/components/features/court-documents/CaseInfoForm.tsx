import React from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface CaseInfoFormProps {
  title: string;
  autoTitle: string;
  setTitle: (val: string) => void;
  caseNumber: string;
  setCaseNumber: (val: string) => void;
  jurisdiction: string;
  setJurisdiction: (val: string) => void;
}

export const CaseInfoForm: React.FC<CaseInfoFormProps> = ({
  title,
  autoTitle,
  setTitle,
  caseNumber,
  setCaseNumber,
  jurisdiction,
  setJurisdiction
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Case Information</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Document Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoTitle}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Case Number</Label>
          <Input
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Jurisdiction</Label>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="federal">Federal Court</SelectItem>
              <SelectItem value="state_ny">New York State</SelectItem>
              <SelectItem value="state_ca">California State</SelectItem>
              <SelectItem value="state_tx">Texas State</SelectItem>
              <SelectItem value="state_fl">Florida State</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
