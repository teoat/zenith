import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import type { Relationship } from '../../types/investigation';

interface RelationshipFormProps {
  relationship: Relationship;
  onSubmit: (relationship: Relationship) => void;
}

const RelationshipForm: React.FC<RelationshipFormProps> = ({ relationship, onSubmit }) => {
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
            <SelectItem value="owns">Owns</SelectItem>
            <SelectItem value="transacts_with">Transacts With</SelectItem>
            <SelectItem value="located_at">Located At</SelectItem>
            <SelectItem value="related_to">Related To</SelectItem>
            <SelectItem value="controls">Controls</SelectItem>
            <SelectItem value="beneficial_owner">Beneficial Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="rel-strength">Strength (1-100)</Label>
        <Input
          id="rel-strength"
          type="number"
          min="1"
          max="100"
          value={formData.strength}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) || 1 }))}
        />
      </div>

      <div>
        <Label htmlFor="rel-notes">Evidence/Notes</Label>
        <Textarea
          id="rel-notes"
          value={(formData.properties.notes as string) || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({
            ...prev,
            properties: { ...prev.properties, notes: e.target.value }
          }))}
          placeholder="Add evidence or notes about this relationship"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Save Relationship
      </Button>
    </form>
  );
};

export default RelationshipForm;
