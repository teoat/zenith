import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCases } from '@/hooks/useCases';
import { SARFormData } from '@/types/sar';
import { Case } from '@/types/schema'; // Updated to use the correct type source

export const useSARCreation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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

  const filteredCases = cases.filter((case_: Case) =>
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

  return {
    step,
    setStep,
    loading,
    casesLoading,
    casesError,
    searchQuery,
    setSearchQuery,
    selectedCase,
    error,
    success,
    formData,
    setFormData,
    filteredCases,
    handleCaseSelect,
    handleActivityToggle,
    handleSubmit
  };
};
