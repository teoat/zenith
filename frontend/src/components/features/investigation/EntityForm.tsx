import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Entity } from '@/types/investigation';

interface EntityFormProps {
  onSubmit: (data: Partial<Entity>) => void;
}

export const EntityForm: React.FC<EntityFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'person',
    name: '',
    riskScore: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Partial<Entity>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="entity-type-select" className="text-sm font-medium">Entity Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger id="entity-type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="transaction">Transaction</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="entity-name">Name</Label>
        <Input
          id="entity-name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter entity name"
          required
        />
      </div>

      <div>
        <Label htmlFor="risk-score">Risk Score (0-100)</Label>
        <Input
          id="risk-score"
          type="number"
          min="0"
          max="100"
          value={formData.riskScore}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, riskScore: parseInt(e.target.value) || 0 }))}
        />
      </div>

      <Button type="submit" className="w-full">
        Add Entity
      </Button>
    </form>
  );
};
