import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Relationship } from '@/types/investigation';

interface RelationshipFormProps {
  relationship: Relationship;
  onSubmit: (relationship: Relationship) => void;
}

export const RelationshipForm: React.FC<RelationshipFormProps> = ({ relationship, onSubmit }) => {
  const [formData, setFormData] = useState(relationship);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="rel-type">Relationship Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Relationship['type'] }))}
        >
          <SelectTrigger id="rel-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="related_to">Related To</SelectItem>
            <SelectItem value="owns">Owns</SelectItem>
            <SelectItem value="transacts_with">Transacts With</SelectItem>
            <SelectItem value="located_at">Located At</SelectItem>
            <SelectItem value="controls">Controls</SelectItem>
            <SelectItem value="beneficial_owner">Beneficial Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        Save Relationship
      </Button>
    </form>
  );
};
