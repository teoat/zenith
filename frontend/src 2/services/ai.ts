import { API_BASE as API_BASE_URL } from './client';
import { AIPersona } from '../context/AIContext';

class AIService {
  async chat(message: string, context: any, persona: AIPersona = 'frenly') {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message, context, persona })
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }

  async getMultiPersonaAnalysis(caseId: string, personas: AIPersona[] = ['frenly', 'legal', 'forensic', 'investigator']) {
    const response = await fetch(`${API_BASE_URL}/ai/multi-persona-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ case_id: caseId, personas })
    });
    
    if (!response.ok) throw new Error('Failed to get multi-persona analysis');
    return response.json();
  }

  async investigateSubject(subjectId: string) {
    const response = await fetch(`${API_BASE_URL}/ai/investigate/${subjectId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to investigate subject');
    return response.json();
  }

  async getProactiveSuggestions(alertId: string, context: string) {
    const response = await fetch(`${API_BASE_URL}/ai/proactive-suggestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ alert_id: alertId, context })
    });
    if (!response.ok) throw new Error('Failed to get proactive suggestions');
    return response.json();
  }
}

export const aiService = new AIService();
