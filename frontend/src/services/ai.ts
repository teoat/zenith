import { API_BASE as API_BASE_URL } from './client';
import { AIPersona } from '../context/AIContext';
import { AgentDraft, AgentApproval } from '../types/api';

class AIService {
  async chat(message: string, context: Record<string, unknown>, persona: AIPersona = 'frenly') {
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

  async getAgentDrafts(): Promise<AgentDraft[]> {
    const response = await fetch(`${API_BASE_URL}/ai/agent-drafts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    // For now, if 404/error, return mock data
    if (!response.ok) {
        return [
            {
                id: '1',
                agentName: 'ReportGeneratorAgent',
                draftType: 'report',
                title: 'Fraud Investigation Report - Case #2024-001',
                content: 'This report details the comprehensive fraud investigation conducted on case #2024-001. The investigation revealed multiple suspicious transactions totaling $250,000 across 15 different accounts. Key findings include unusual transaction patterns and connections to known high-risk entities.',
                targetEntity: 'CASE-2024-001',
                confidence: 0.92,
                createdAt: '2024-12-17T10:00:00Z',
                status: 'draft',
                lastModified: '2024-12-17T10:00:00Z',
                tags: ['fraud', 'investigation', 'high-value']
            },
            {
                id: '2',
                agentName: 'SummaryAgent',
                draftType: 'summary',
                title: 'Executive Summary - Q4 Compliance Review',
                content: 'Quarterly compliance review summary indicates 98.5% adherence to regulatory requirements. Three minor violations were identified and remediated within the reporting period. Overall compliance posture remains strong with continuous improvement in automated monitoring systems.',
                targetEntity: 'Q4-2024-Compliance',
                confidence: 0.87,
                createdAt: '2024-12-17T09:30:00Z',
                status: 'reviewing',
                reviewer: 'compliance_team',
                lastModified: '2024-12-17T11:15:00Z',
                tags: ['compliance', 'quarterly', 'executive']
            },
            {
                id: '3',
                agentName: 'RiskAnalyzerAgent',
                draftType: 'analysis',
                title: 'Risk Assessment Analysis - Customer Segment A',
                content: 'Risk assessment analysis for Customer Segment A reveals moderate risk exposure with potential vulnerabilities in transaction monitoring. Recommended actions include enhanced monitoring protocols and additional verification steps for high-value transactions.',
                targetEntity: 'SEGMENT-A',
                confidence: 0.78,
                createdAt: '2024-12-17T08:45:00Z',
                status: 'approved',
                reviewer: 'risk_team',
                lastModified: '2024-12-17T09:20:00Z',
                tags: ['risk', 'assessment', 'monitoring']
            }
        ];
    }
    return response.json();
  }

  async updateAgentDraft(id: string, updates: Partial<AgentDraft>): Promise<AgentDraft> {
    const response = await fetch(`${API_BASE_URL}/ai/agent-drafts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error('Failed to update draft');
    return response.json();
  }

  async getAgentApprovals(): Promise<AgentApproval[]> {
    const response = await fetch(`${API_BASE_URL}/ai/agent-approvals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    // For now, if 404/error, return mock data
    if (!response.ok) {
        return [
            {
                id: '1',
                agentName: 'FraudDetectionAgent',
                action: 'Flag Transaction',
                target: 'TXN-2024-001',
                confidence: 0.89,
                timestamp: '2024-12-17T10:30:00Z',
                status: 'pending',
                risk: 'high',
                details: 'Suspicious transaction pattern detected with 89% confidence'
            },
            {
                id: '2',
                agentName: 'ComplianceAgent',
                action: 'Escalate Case',
                target: 'CASE-2024-045',
                confidence: 0.76,
                timestamp: '2024-12-17T09:15:00Z',
                status: 'pending',
                risk: 'medium',
                details: 'Compliance violation detected in regulatory reporting'
            },
            {
                id: '3',
                agentName: 'RiskAssessmentAgent',
                action: 'Block Account',
                target: 'ACC-789012',
                confidence: 0.95,
                timestamp: '2024-12-17T08:45:00Z',
                status: 'approved',
                risk: 'high',
                details: 'High-risk account activity requiring immediate blocking'
            }
        ];
    }
    return response.json();
  }

  async updateApprovalStatus(id: string, status: 'approved' | 'rejected'): Promise<AgentApproval> {
    const response = await fetch(`${API_BASE_URL}/ai/agent-approvals/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) throw new Error('Failed to update approval status');
    return response.json();
  }
}

export const aiService = new AIService();
