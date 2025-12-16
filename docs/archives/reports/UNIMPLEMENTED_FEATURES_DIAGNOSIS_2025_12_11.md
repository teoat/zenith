# Unimplemented Features Diagnosis & Implementation Guide (2025-12-11)

> **Date:** December 11, 2025  
> **Scope:** All unimplemented features across strategy documents  
> **Goal:** Diagnose each feature, provide complete implementation guides, prioritize for Phase 6

---

## Executive Summary

**Current Status:** 65% of strategic vision implemented (133/205 features)

**Critical Gaps:** 42 unimplemented features blocking 35% of strategic value

**Effort to Complete:** 11-16 days development (45+ calendar days with dependencies)

**Immediate Priority:** Phase 6A (Onboarding + Fraud Proofs) = 2-3 weeks

---

## 📊 Unimplemented Features Summary Table

| Category | Total | Done | Gap | Critical | Priority |
|----------|-------|------|-----|----------|----------|
| **User Onboarding** | 6 | 0 | 6 | 🔴 YES | 🔴 P0 |
| **Fraud Proof Mechanisms** | 8 | 4 | 4 | 🔴 YES | 🔴 P0 |
| **Advanced AI** | 12 | 4 | 8 | 🟡 NO | 🟡 P1 |
| **User Journey UX** | 7 | 4 | 3 | 🟡 NO | 🟡 P1 |
| **Dashboard Features** | 5 | 3 | 2 | 🟠 NICE | 🟠 P2 |
| **Collaboration** | 2 | 0 | 2 | 🟡 NO | 🟡 P1 |
| **Report Enhancement** | 4 | 2 | 2 | 🟡 NO | 🟡 P1 |
| **TOTAL** | **44** | **17** | **27** | - | - |

---

## 🔴 PHASE 6A: CRITICAL GAPS (User Onboarding) - 0% COMPLETE

### Feature 6A.1: Role Selection Wizard (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - First-run experience  
**Effort:** 1 day  
**Files Affected:**  
- `frontend/src/pages/OnboardingWizard.tsx` (NEW)  
- `frontend/src/components/RoleSelector.tsx` (NEW)  
- `frontend/src/hooks/useOnboarding.ts` (NEW)  

**Description:**
Users should see role selection on first launch before accessing dashboard. This drives all subsequent UI presets and permissions.

**Current Gap Analysis:**
- ❌ No OnboardingWizard page component
- ❌ No role selection UI in login flow
- ❌ No role-based layout switching logic
- ✅ Role model exists in backend (`User.role`)

**Implementation Steps:**

1. **Create OnboardingWizard.tsx** (150 LOC)
```typescript
// frontend/src/pages/OnboardingWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

interface RoleOption {
  id: 'investigator' | 'legal' | 'admin' | 'analyst';
  title: string;
  description: string;
  icon: React.ReactNode;
  permissions: string[];
}

const ROLES: RoleOption[] = [
  {
    id: 'investigator',
    title: 'Investigator',
    description: 'Case management, evidence analysis, graph investigation',
    icon: '🔍',
    permissions: ['cases:read', 'cases:write', 'evidence:read', 'graph:read'],
  },
  {
    id: 'legal',
    title: 'Legal Counsel',
    description: 'Report generation, case review, conclusion preparation',
    icon: '⚖️',
    permissions: ['cases:read', 'reports:write', 'audit:read'],
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'System configuration, user management, compliance',
    icon: '⚙️',
    permissions: ['*'],
  },
  {
    id: 'analyst',
    title: 'Data Analyst',
    description: 'Statistical analysis, pattern detection, reporting',
    icon: '📊',
    permissions: ['cases:read', 'graph:read', 'reports:read'],
  },
];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId);
    await updateProfile({ role: roleId });
    setTimeout(() => navigate('/dashboard'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to 378x492</h1>
          <p className="text-xl text-slate-300">Let's get you set up with the right workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all p-6 ${
                selectedRole === role.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-slate-400'
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-xl font-bold mb-2">{role.title}</h3>
              <p className="text-slate-600 mb-4">{role.description}</p>
              <div className="text-sm text-slate-500">
                {role.permissions.length} permissions
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            You can change your role anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
};
```

2. **Update Login.tsx** to redirect to OnboardingWizard
```typescript
// In Login.tsx, after successful login:
if (!user.roleConfirmed) {
  navigate('/onboarding');
} else {
  navigate('/dashboard');
}
```

3. **Create role-based layout hook** (80 LOC)
```typescript
// frontend/src/hooks/useRoleBasedLayout.ts
import { useAuth } from './useAuth';

interface LayoutConfig {
  sidebarWidth: string;
  showCollaboration: boolean;
  defaultPage: string;
  visiblePages: string[];
  toolbarActions: string[];
}

const LAYOUT_PRESETS: Record<string, LayoutConfig> = {
  investigator: {
    sidebarWidth: '320px',
    showCollaboration: true,
    defaultPage: 'cases',
    visiblePages: ['dashboard', 'cases', 'investigation', 'forensics'],
    toolbarActions: ['search', 'filter', 'export'],
  },
  legal: {
    sidebarWidth: '280px',
    showCollaboration: false,
    defaultPage: 'cases',
    visiblePages: ['cases', 'reporting', 'settings'],
    toolbarActions: ['search', 'export'],
  },
  admin: {
    sidebarWidth: '320px',
    showCollaboration: true,
    defaultPage: 'dashboard',
    visiblePages: ['dashboard', 'cases', 'settings', 'audit'],
    toolbarActions: ['search', 'admin', 'config'],
  },
};

export const useRoleBasedLayout = (): LayoutConfig => {
  const { user } = useAuth();
  return LAYOUT_PRESETS[user.role] || LAYOUT_PRESETS.investigator;
};
```

**Testing Checklist:**
- [ ] User redirected to OnboardingWizard on first login
- [ ] Role selection persists to database
- [ ] Layout adjusts based on selected role
- [ ] Navigation back to login works
- [ ] Role change in Settings works

**Success Metrics:**
- New users complete role selection in <30 seconds
- Layout correctly reflects selected role
- No user confusion about available features

---

### Feature 6A.2: Rookie Checklist Gamification (Frontend + Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - User engagement  
**Effort:** 1.5 days  
**Files Affected:**  
- `frontend/src/components/RookieChecklist.tsx` (NEW)  
- `backend/api/onboarding.py` (NEW)  

**Description:**
4-step guided task list for first-time users: (1) Upload case, (2) View graph, (3) Add evidence, (4) Generate report. Reward with "Level 1 Investigator" badge.

**Current Gap Analysis:**
- ❌ No checklist component
- ❌ No task progress tracking
- ❌ No badge/gamification system
- ✅ Can leverage existing case/evidence/report flows

**Implementation Steps:**

1. **Create RookieChecklist.tsx** (180 LOC)
```typescript
// frontend/src/components/RookieChecklist.tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  action: string;
}

export const RookieChecklist: React.FC = () => {
  const { get, post } = useApi();
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [earned, setEarned] = useState(false);

  const TASKS: ChecklistTask[] = [
    {
      id: 'upload-case',
      title: 'Upload Your First Case',
      description: 'Drag evidence files into the Evidence tab',
      icon: '📁',
      completed: false,
      action: 'Go to Evidence',
    },
    {
      id: 'view-graph',
      title: 'Explore the Investigation Graph',
      description: 'View relationships between entities',
      icon: '🕸️',
      completed: false,
      action: 'Open Investigation',
    },
    {
      id: 'add-evidence',
      title: 'Tag Key Evidence',
      description: 'Mark important files with tags',
      icon: '🏷️',
      completed: false,
      action: 'Go to Evidence',
    },
    {
      id: 'generate-report',
      title: 'Generate Your First Report',
      description: 'Create a PDF conclusion document',
      icon: '📄',
      completed: false,
      action: 'Go to Reporting',
    },
  ];

  useEffect(() => {
    loadChecklistProgress();
  }, []);

  const loadChecklistProgress = async () => {
    const progress = await get('/api/onboarding/checklist');
    setTasks(progress.tasks);
    updateCompletionPercentage(progress.tasks);
  };

  const updateCompletionPercentage = (tasks: ChecklistTask[]) => {
    const completed = tasks.filter(t => t.completed).length;
    const percentage = Math.round((completed / tasks.length) * 100);
    setCompletionPercentage(percentage);

    if (percentage === 100 && !earned) {
      setEarned(true);
      // Show badge unlock animation
    }
  };

  const handleTaskClick = (taskId: string) => {
    // Navigate to relevant page
    const routes = {
      'upload-case': '/forensics',
      'view-graph': '/investigation',
      'add-evidence': '/forensics',
      'generate-report': '/reporting',
    };
    // window.location.href = routes[taskId];
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Rookie Checklist</h3>
          <p className="text-sm text-slate-600">Complete 4 tasks to earn "Level 1 Investigator"</p>
        </div>
        {earned && (
          <div className="text-4xl animate-bounce">🏆</div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">Progress</span>
          <span className="text-sm font-bold text-indigo-600">{completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {TASKS.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-lg flex items-start justify-between ${
              task.completed
                ? 'bg-green-100 border border-green-300'
                : 'bg-white border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-1">{task.icon}</span>
              <div>
                <p className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {task.title}
                </p>
                <p className="text-sm text-slate-600">{task.description}</p>
              </div>
            </div>
            {task.completed ? (
              <span className="text-green-600 font-bold">✓</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTaskClick(task.id)}
              >
                {task.action}
              </Button>
            )}
          </div>
        ))}
      </div>

      {earned && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-lg text-center">
          <p className="text-lg font-bold text-yellow-900">🎉 Congratulations!</p>
          <p className="text-sm text-yellow-800">You've earned "Level 1 Investigator" badge</p>
        </div>
      )}
    </Card>
  );
};
```

2. **Create onboarding API backend** (120 LOC)
```python
# backend/api/onboarding.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

@router.get("/checklist")
async def get_checklist(session: Session = Depends(get_db), user = Depends(get_current_user)):
    """Get current user's rookie checklist progress"""
    checklist_tasks = {
        'upload-case': user.cases.count() > 0,
        'view-graph': False,  # Track via page visit
        'add-evidence': user.evidence.count() > 0,
        'generate-report': user.reports.count() > 0,
    }
    
    tasks = [
        {
            'id': 'upload-case',
            'title': 'Upload Your First Case',
            'description': 'Drag evidence files into the Evidence tab',
            'icon': '📁',
            'completed': checklist_tasks['upload-case'],
            'action': 'Go to Evidence',
        },
        # ... other tasks
    ]
    
    completion_percentage = sum(1 for t in tasks if t['completed']) / len(tasks) * 100
    
    return {
        'tasks': tasks,
        'completion': completion_percentage,
        'badge_earned': completion_percentage == 100,
    }

@router.post("/task/{task_id}/complete")
async def complete_task(task_id: str, session: Session = Depends(get_db), user = Depends(get_current_user)):
    """Mark a task as complete"""
    # Update user's checklist progress
    return {'status': 'completed'}
```

**Testing Checklist:**
- [ ] Checklist appears for new users
- [ ] Tasks track correctly (case upload, evidence, report)
- [ ] Progress bar updates in real-time
- [ ] Badge unlocks at 100% completion
- [ ] Animation plays on badge unlock

**Success Metrics:**
- 80% of new users complete checklist within first 10 minutes
- Users reach level 1 in <30 minutes average
- Badge drive engagement (track retention)

---

### Feature 6A.3: Just-in-Time Tooltips (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - Feature discovery  
**Effort:** 1.5 days  
**Files Affected:**  
- `package.json` (add `react-joyride` dependency)  
- `frontend/src/hooks/useTooltips.ts` (NEW)  
- `frontend/src/components/OnboardingTour.tsx` (NEW)  

**Description:**
Spotlight tours that highlight key UI elements on first visit. Example: "This is the Investigation Graph - drag nodes to rearrange" when user first opens Investigation page.

**Current Gap Analysis:**
- ❌ No tooltip library integrated
- ❌ No tour definitions
- ❌ No per-page welcome messages
- ✅ All UI components exist

**Implementation Steps:**

1. **Install react-joyride**
```bash
npm install react-joyride --save
```

2. **Create OnboardingTour.tsx** (120 LOC)
```typescript
// frontend/src/components/OnboardingTour.tsx
import React, { useEffect, useState } from 'react';
import Joyride, { Step } from 'react-joyride';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TourConfig {
  id: string;
  steps: Step[];
  enabled: boolean;
}

const TOUR_CONFIGS: Record<string, TourConfig> = {
  dashboard: {
    id: 'dashboard-tour',
    enabled: true,
    steps: [
      {
        target: '[data-tour="threat-map"]',
        content: 'Welcome! This threat map shows fraud cases by location. Red areas indicate high-risk regions.',
        title: 'Threat Map',
        placement: 'bottom',
      },
      {
        target: '[data-tour="metrics"]',
        content: 'Your key performance indicators at a glance. Cases pending, risk scores, and alerts.',
        title: 'KPI Metrics',
        placement: 'bottom',
      },
      {
        target: '[data-tour="queue"]',
        content: 'New cases appear here for triage. Click to preview case details.',
        title: 'Review Queue',
        placement: 'left',
      },
    ],
  },
  cases: {
    id: 'cases-tour',
    enabled: true,
    steps: [
      {
        target: '[data-tour="kanban"]',
        content: 'Drag cases between columns to move through your workflow.',
        title: 'Kanban Board',
        placement: 'top',
      },
      {
        target: '[data-tour="filters"]',
        content: 'Filter cases by status, risk level, assignee, and more.',
        title: 'Faceted Search',
        placement: 'left',
      },
    ],
  },
  investigation: {
    id: 'investigation-tour',
    enabled: true,
    steps: [
      {
        target: '[data-tour="graph"]',
        content: 'This is the Investigation Graph. Drag nodes to rearrange. Click to inspect relationships.',
        title: 'Entity Graph',
        placement: 'top',
      },
      {
        target: '[data-tour="registry"]',
        content: 'View and manage all entities discovered in this case.',
        title: 'Entity Registry',
        placement: 'left',
      },
      {
        target: '[data-tour="node-inspector"]',
        content: 'Click any node to see detailed information and AI insights.',
        title: 'Node Inspector',
        placement: 'left',
      },
    ],
  },
};

export const OnboardingTour: React.FC<{ pageName: string }> = ({ pageName }) => {
  const { user } = useAuth();
  const [viewedTours, setViewedTours] = useLocalStorage('viewedTours', {});
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tourConfig = TOUR_CONFIGS[pageName];

  useEffect(() => {
    if (!tourConfig) return;

    // Only show tour on first visit to page
    const hasViewed = viewedTours[pageName];
    if (!hasViewed && tourConfig.enabled) {
      setTimeout(() => setRun(true), 500); // Delay for page to fully render
    }
  }, [pageName, tourConfig, viewedTours]);

  const handleTourCallback = (event: any) => {
    if (event.status === 'finished' || event.status === 'skipped') {
      setRun(false);
      setViewedTours({ ...viewedTours, [pageName]: true });
    } else if (event.type === 'step:after') {
      setStepIndex(event.index);
    }
  };

  if (!tourConfig || !run) return null;

  return (
    <Joyride
      steps={tourConfig.steps}
      run={run}
      stepIndex={stepIndex}
      onCallback={handleTourCallback}
      continuous
      scrollToFirstStep
      showSkipButton
      styles={{
        options: {
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
        },
      }}
    />
  );
};
```

3. **Update main pages to include tour markers**
```typescript
// In Investigation.tsx:
<div data-tour="graph" className="...">
  <GraphCanvas />
</div>

<div data-tour="registry" className="...">
  <EntityRegistry />
</div>

<div data-tour="node-inspector" className="...">
  <NodeInspector />
</div>
```

**Testing Checklist:**
- [ ] Tours appear on first page visit only
- [ ] Tours can be skipped
- [ ] Tours don't appear on subsequent visits
- [ ] All UI elements highlighted correctly
- [ ] Mobile-friendly tour display

**Success Metrics:**
- 95% of new users see at least one tour
- Users watch 80%+ of tour steps
- 30% reduction in support tickets for feature discovery

---

### Feature 6A.4: Frenly Welcome Messaging (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - User guidance  
**Effort:** 0.5 days  
**Files Affected:**  
- `frontend/src/components/FrienlyWelcome.tsx` (NEW)  

**Description:**
AI guide appears as "Senior Partner" with welcome message and initial suggestions. Example: "I'm Frenly, your investigation assistant. Let me help you get started with this case."

**Implementation:**
```typescript
// frontend/src/components/FrienlyWelcome.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

const WELCOME_MESSAGES = [
  "I'm Frenly, your investigation assistant. Let's solve this case together! 🔍",
  "Start by uploading evidence files, or jump straight to the graph to explore relationships.",
  "I'll analyze patterns and flag suspicious activity. You focus on the strategy.",
  "Need help? Click the ? icon anytime for guidance on any feature.",
];

const SUGGESTED_ACTIONS = [
  { label: 'Upload Evidence', icon: '📁', href: '/forensics' },
  { label: 'Explore Graph', icon: '🕸️', href: '/investigation' },
  { label: 'View Cases', icon: '📋', href: '/cases' },
  { label: 'Learn Features', icon: '❓', href: '/help' },
];

export const FrienlyWelcome: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessageIndex(1);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="text-4xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900">Welcome to Frenly</h3>
            <p className="text-slate-600 mt-2 text-sm">{WELCOME_MESSAGES[messageIndex]}</p>

            {messageIndex >= 1 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {SUGGESTED_ACTIONS.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-center hover:border-blue-400 transition-all"
                  >
                    <div className="text-2xl mb-1">{action.icon}</div>
                    <div className="text-xs font-semibold text-slate-700">{action.label}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </Card>
  );
};
```

---

### Feature 6A.5: Educational Empty States (Frontend)

**Current Status:** 🟡 PARTIALLY IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - Guidance  
**Effort:** 0.5 days  
**Files Affected:**  
- `frontend/src/components/EmptyStates.tsx` (ENHANCE)  

**Description:**
Smart empty state messages that guide users on what to do. Example: "No cases yet. Upload evidence to get started." with action button.

**Implementation (existing component enhancement):**
```typescript
// frontend/src/components/EmptyStates.tsx
interface EmptyStateProps {
  type: 'cases' | 'evidence' | 'graph' | 'search' | 'reports';
  onAction?: () => void;
}

const EMPTY_STATE_CONFIG = {
  cases: {
    icon: '📋',
    title: 'No Cases Yet',
    message: 'Start investigating by uploading case files or creating a new case.',
    action: 'Upload Evidence',
    actionIcon: '📁',
  },
  evidence: {
    icon: '📁',
    title: 'No Evidence Files',
    message: 'Drag and drop evidence files here, or click to browse your computer.',
    action: 'Browse Files',
    actionIcon: '📂',
  },
  graph: {
    icon: '🕸️',
    title: 'Empty Graph',
    message: 'Upload evidence or create entities to start building your investigation graph.',
    action: 'Add Entities',
    actionIcon: '➕',
  },
  search: {
    icon: '🔍',
    title: 'No Results Found',
    message: 'Try different keywords or filters to find what you\'re looking for.',
    action: 'Clear Filters',
    actionIcon: '🔄',
  },
  reports: {
    icon: '📄',
    title: 'No Reports Yet',
    message: 'Complete your investigation and generate a conclusion report.',
    action: 'Start Report',
    actionIcon: '✍️',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const config = EMPTY_STATE_CONFIG[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{config.icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{config.title}</h3>
      <p className="text-slate-600 mb-6 max-w-md">{config.message}</p>
      <button
        onClick={onAction}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
      >
        {config.actionIcon} {config.action}
      </button>
    </div>
  );
};
```

---

### Feature 6A.6: Role-Based Layout Presets (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - User experience  
**Effort:** 0.5 days  
**Files Affected:**  
- `frontend/src/hooks/useRoleBasedLayout.ts` (ALREADY CREATED ABOVE)  

**Implementation Note:** Already covered in Feature 6A.1 (useRoleBasedLayout hook)

---

## 🔴 PHASE 6B: CRITICAL GAPS (Fraud Proof Mechanisms) - 55% COMPLETE

### Feature 6B.1: Metadata Correlation Engine (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - Court admissibility  
**Effort:** 2 days  
**Files Affected:**  
- `backend/services/metadata_correlation.py` (NEW)  
- `backend/api/graph.py` (ENHANCE)  

**Description:**
Backend service that detects relationships between entities via shared metadata: phone numbers, email addresses, IP addresses, physical addresses, etc.

**Current Gap Analysis:**
- ❌ No correlation service exists
- ✅ Entity data is collected (transactions contain email, phone, address)
- ✅ Database schema supports relationships
- ❌ No algorithm to find metadata overlaps

**Implementation Steps:**

1. **Create MetadataCorrelationEngine service** (250 LOC)
```python
# backend/services/metadata_correlation.py
from typing import List, Dict, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.models import Entity, Relationship, Transaction
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class MetadataCorrelationEngine:
    """
    Detects relationships between entities via shared metadata.
    
    Examples:
    - Same phone number: Person A and Person B share +1-555-0123
    - Same email: Person C and Company D both registered to john@example.com
    - Same IP: User E and Merchant F both accessed from 192.168.1.100
    - Same address: Individual G and Shell Corp H both at 123 Main St
    """
    
    def __init__(self, session: Session):
        self.session = session
        self.correlation_strength_weights = {
            'phone': 0.8,      # High weight - phone is unique
            'email': 0.85,     # Very high weight
            'address': 0.7,    # Medium weight - shared addresses are common
            'ip_address': 0.6, # Lower weight - IP can be shared
            'name_similarity': 0.5, # Fuzzy match on names
        }

    def find_all_correlations(self, case_id: str) -> List[Dict]:
        """Find all metadata correlations within a case"""
        entities = self.session.query(Entity).filter(
            Entity.case_id == case_id
        ).all()
        
        correlations = []
        
        # Check each metadata type
        correlations.extend(self._find_phone_correlations(entities))
        correlations.extend(self._find_email_correlations(entities))
        correlations.extend(self._find_address_correlations(entities))
        correlations.extend(self._find_ip_correlations(entities))
        
        # Deduplicate (avoid reporting same pair twice)
        unique_correlations = []
        seen = set()
        for corr in correlations:
            pair_key = tuple(sorted([corr['entity_a'], corr['entity_b']]))
            if pair_key not in seen:
                unique_correlations.append(corr)
                seen.add(pair_key)
        
        return unique_correlations

    def _find_phone_correlations(self, entities: List[Entity]) -> List[Dict]:
        """Find entities sharing phone numbers"""
        phone_map = defaultdict(list)
        
        for entity in entities:
            # Extract phone from metadata
            phones = self._extract_phones(entity)
            for phone in phones:
                phone_map[phone].append(entity)
        
        correlations = []
        for phone, entity_list in phone_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append({
                            'entity_a': entity_list[i].id,
                            'entity_b': entity_list[j].id,
                            'metadata_type': 'phone',
                            'metadata_value': phone,
                            'confidence': self.correlation_strength_weights['phone'],
                            'reasoning': f'Both entities share phone {phone}',
                        })
        
        return correlations

    def _find_email_correlations(self, entities: List[Entity]) -> List[Dict]:
        """Find entities sharing email addresses"""
        email_map = defaultdict(list)
        
        for entity in entities:
            emails = self._extract_emails(entity)
            for email in emails:
                email_map[email.lower()].append(entity)
        
        correlations = []
        for email, entity_list in email_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append({
                            'entity_a': entity_list[i].id,
                            'entity_b': entity_list[j].id,
                            'metadata_type': 'email',
                            'metadata_value': email,
                            'confidence': self.correlation_strength_weights['email'],
                            'reasoning': f'Both entities share email {email}',
                        })
        
        return correlations

    def _find_address_correlations(self, entities: List[Entity]) -> List[Dict]:
        """Find entities sharing physical addresses"""
        address_map = defaultdict(list)
        
        for entity in entities:
            addresses = self._extract_addresses(entity)
            for address in addresses:
                address_key = self._normalize_address(address)
                address_map[address_key].append(entity)
        
        correlations = []
        for address, entity_list in address_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append({
                            'entity_a': entity_list[i].id,
                            'entity_b': entity_list[j].id,
                            'metadata_type': 'address',
                            'metadata_value': address,
                            'confidence': self.correlation_strength_weights['address'],
                            'reasoning': f'Both entities share address {address}',
                        })
        
        return correlations

    def _find_ip_correlations(self, entities: List[Entity]) -> List[Dict]:
        """Find entities sharing IP addresses"""
        ip_map = defaultdict(list)
        
        for entity in entities:
            ips = self._extract_ips(entity)
            for ip in ips:
                ip_map[ip].append(entity)
        
        correlations = []
        for ip, entity_list in ip_map.items():
            if len(entity_list) > 1:
                for i in range(len(entity_list)):
                    for j in range(i + 1, len(entity_list)):
                        correlations.append({
                            'entity_a': entity_list[i].id,
                            'entity_b': entity_list[j].id,
                            'metadata_type': 'ip_address',
                            'metadata_value': ip,
                            'confidence': self.correlation_strength_weights['ip_address'],
                            'reasoning': f'Both entities accessed from IP {ip}',
                        })
        
        return correlations

    def _extract_phones(self, entity: Entity) -> Set[str]:
        """Extract phone numbers from entity metadata"""
        phones = set()
        if entity.metadata and 'phone' in entity.metadata:
            phones.add(entity.metadata['phone'])
        if entity.metadata and 'phones' in entity.metadata:
            phones.update(entity.metadata['phones'])
        return phones

    def _extract_emails(self, entity: Entity) -> Set[str]:
        """Extract emails from entity metadata"""
        emails = set()
        if entity.metadata and 'email' in entity.metadata:
            emails.add(entity.metadata['email'])
        if entity.metadata and 'emails' in entity.metadata:
            emails.update(entity.metadata['emails'])
        return emails

    def _extract_addresses(self, entity: Entity) -> Set[str]:
        """Extract addresses from entity metadata"""
        addresses = set()
        if entity.metadata and 'address' in entity.metadata:
            addresses.add(entity.metadata['address'])
        if entity.metadata and 'addresses' in entity.metadata:
            addresses.update(entity.metadata['addresses'])
        return addresses

    def _extract_ips(self, entity: Entity) -> Set[str]:
        """Extract IP addresses from entity metadata"""
        ips = set()
        if entity.metadata and 'ip_address' in entity.metadata:
            ips.add(entity.metadata['ip_address'])
        if entity.metadata and 'ip_addresses' in entity.metadata:
            ips.update(entity.metadata['ip_addresses'])
        return ips

    def _normalize_address(self, address: str) -> str:
        """Normalize address for comparison (lowercase, strip whitespace)"""
        return address.lower().strip()
```

2. **Update graph API to include correlations** (80 LOC)
```python
# In backend/api/graph.py:
from backend.services.metadata_correlation import MetadataCorrelationEngine

@router.get("/api/graph/{case_id}/correlations")
async def get_metadata_correlations(
    case_id: str,
    session: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get all metadata correlations for a case"""
    engine = MetadataCorrelationEngine(session)
    correlations = engine.find_all_correlations(case_id)
    
    # Create Relationship records for UI visualization
    for corr in correlations:
        existing = session.query(Relationship).filter(
            Relationship.source_id == corr['entity_a'],
            Relationship.target_id == corr['entity_b'],
            Relationship.relationship_type == corr['metadata_type'],
        ).first()
        
        if not existing:
            rel = Relationship(
                case_id=case_id,
                source_id=corr['entity_a'],
                target_id=corr['entity_b'],
                relationship_type=corr['metadata_type'],
                metadata={
                    'metadata_value': corr['metadata_value'],
                    'confidence': corr['confidence'],
                    'reasoning': corr['reasoning'],
                }
            )
            session.add(rel)
    
    session.commit()
    
    return {
        'correlations': correlations,
        'total_found': len(correlations),
    }
```

**Testing Checklist:**
- [ ] Phone correlations found correctly
- [ ] Email correlations found correctly
- [ ] Address correlations found correctly
- [ ] IP correlations found correctly
- [ ] No duplicate correlations reported
- [ ] Relationships visualized in graph
- [ ] Confidence scores accurate

**Success Metrics:**
- Finds 95%+ of actual metadata overlaps
- No false positives (valid correlations only)
- Execution time <5 seconds for 1000 entities
- Relationships display correctly in graph UI

---

### Feature 6B.2: Temporal Burst Detection (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - Structuring detection  
**Effort:** 1.5 days  
**Files Affected:**  
- `backend/services/temporal_burst_detector.py` (NEW)  
- `backend/api/fraud.py` (ENHANCE)  

**Description:**
Identifies structuring patterns: 10+ small transactions in 48 hours. Core for detecting money laundering attempts.

**Implementation:**
```python
# backend/services/temporal_burst_detector.py
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from backend.models import Transaction, Fraud Rule
from collections import defaultdict

class TemporalBurstDetector:
    """
    Detects temporal burst patterns in transaction data.
    
    Structuring: Multiple small transactions clustered in time
    - Pattern: 10+ transactions within 48-hour window
    - Amount range: Under reporting threshold ($10k)
    - Confidence: High (classic money laundering indicator)
    """
    
    def __init__(self, session: Session):
        self.session = session
        self.STRUCTURING_THRESHOLD = 10      # 10+ transactions
        self.TIME_WINDOW = timedelta(hours=48)
        self.AMOUNT_THRESHOLD = 10000        # Under $10k
    
    def detect_bursts(self, case_id: str) -> List[Dict]:
        """Detect all temporal burst patterns in a case"""
        transactions = self.session.query(Transaction).filter(
            Transaction.case_id == case_id
        ).order_by(Transaction.timestamp).all()
        
        bursts = []
        
        # Group by sending entity
        by_sender = defaultdict(list)
        for txn in transactions:
            by_sender[txn.sender_id].append(txn)
        
        # Check each sender for burst patterns
        for sender_id, sender_txns in by_sender.items():
            sender_bursts = self._detect_bursts_for_entity(
                sender_id, sender_txns, transaction_type='send'
            )
            bursts.extend(sender_bursts)
        
        # Group by receiving entity
        by_receiver = defaultdict(list)
        for txn in transactions:
            by_receiver[txn.receiver_id].append(txn)
        
        # Check each receiver for burst patterns
        for receiver_id, receiver_txns in by_receiver.items():
            receiver_bursts = self._detect_bursts_for_entity(
                receiver_id, receiver_txns, transaction_type='receive'
            )
            bursts.extend(receiver_bursts)
        
        return bursts
    
    def _detect_bursts_for_entity(
        self,
        entity_id: str,
        transactions: List[Transaction],
        transaction_type: str
    ) -> List[Dict]:
        """Detect bursts for a specific entity"""
        bursts = []
        
        # Sliding window analysis
        for i in range(len(transactions)):
            window_start = transactions[i].timestamp
            window_end = window_start + self.TIME_WINDOW
            
            # Find all transactions in this window
            window_txns = [
                txn for txn in transactions
                if window_start <= txn.timestamp <= window_end
                and txn.amount < self.AMOUNT_THRESHOLD
            ]
            
            # If burst threshold exceeded
            if len(window_txns) >= self.STRUCTURING_THRESHOLD:
                total_amount = sum(txn.amount for txn in window_txns)
                
                burst = {
                    'entity_id': entity_id,
                    'transaction_type': transaction_type,
                    'pattern_type': 'structuring',
                    'transaction_count': len(window_txns),
                    'total_amount': total_amount,
                    'time_window': {
                        'start': window_start.isoformat(),
                        'end': window_end.isoformat(),
                        'duration_hours': 48,
                    },
                    'transactions': [txn.id for txn in window_txns],
                    'confidence': min(len(window_txns) / self.STRUCTURING_THRESHOLD, 1.0),
                    'reasoning': f'{len(window_txns)} small transactions ({window_txns[0].amount}-{window_txns[-1].amount}) within 48 hours - classic structuring pattern',
                }
                
                bursts.append(burst)
        
        return bursts
```

---

### Feature 6B.3: Immutable Audit Logs with Cryptographic Verification (Backend)

**Current Status:** 🟡 PARTIALLY IMPLEMENTED  
**Strategic Value:** 🔴 CRITICAL - Chain of custody  
**Effort:** 1 day  
**Files Affected:**  
- `backend/services/audit_log_service.py` (ENHANCE)  

**Description:**
Make audit logs cryptographically signed with SHA-256 hashing. Each log entry includes a hash of the previous entry, creating an immutable chain.

**Implementation:**
```python
# Enhance backend/services/audit_log_service.py
import hashlib
import hmac
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import AuditLog

class ImmutableAuditLogService:
    """Audit logs with cryptographic chain of custody"""
    
    def __init__(self, session: Session, secret_key: str):
        self.session = session
        self.secret_key = secret_key.encode()
    
    def create_log_entry(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        changes: Dict,
        metadata: Dict = None
    ) -> AuditLog:
        """Create a cryptographically signed audit log entry"""
        
        # Get previous entry to chain it
        previous_entry = self.session.query(AuditLog).order_by(
            AuditLog.created_at.desc()
        ).first()
        
        previous_hash = previous_entry.entry_hash if previous_entry else "0" * 64
        
        # Create entry data
        entry_data = {
            'user_id': user_id,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'changes': changes,
            'timestamp': datetime.utcnow().isoformat(),
            'previous_hash': previous_hash,
        }
        
        # Generate SHA-256 hash of entry
        entry_string = str(entry_data)
        entry_hash = hashlib.sha256(entry_string.encode()).hexdigest()
        
        # Generate HMAC signature for integrity verification
        signature = hmac.new(
            self.secret_key,
            entry_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Create log entry
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            metadata=metadata or {},
            entry_hash=entry_hash,
            previous_hash=previous_hash,
            signature=signature,
        )
        
        self.session.add(log_entry)
        self.session.commit()
        
        return log_entry
    
    def verify_chain_integrity(self, start_id: str = None, end_id: str = None) -> bool:
        """Verify that the entire audit log chain is intact"""
        logs = self.session.query(AuditLog).order_by(AuditLog.created_at).all()
        
        for i, log in enumerate(logs):
            # Verify HMAC signature
            entry_string = str({
                'user_id': log.user_id,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'changes': log.changes,
                'timestamp': log.created_at.isoformat(),
                'previous_hash': log.previous_hash,
            })
            
            expected_signature = hmac.new(
                self.secret_key,
                entry_string.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if log.signature != expected_signature:
                return False  # Tampered!
            
            # Verify chain link
            if i > 0:
                previous_log = logs[i - 1]
                if log.previous_hash != previous_log.entry_hash:
                    return False  # Chain broken!
        
        return True  # All good!
```

---

### Feature 6B.4: Community Detection for Shell Networks (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Shell company detection  
**Effort:** 1.5 days  
**Files Affected:**  
- `backend/services/community_detection.py` (NEW)  

**Description:**
Louvain clustering algorithm to detect isolated entity clusters (shell company networks).

**Implementation:**
```python
# backend/services/community_detection.py
import networkx as nx
from networkx.algorithms import community
from typing import List, Dict
from sqlalchemy.orm import Session
from backend.models import Entity, Relationship

class CommunityDetectionService:
    """
    Detect communities (clusters) in the entity graph.
    
    Used to identify:
    - Shell company networks (isolated clusters)
    - Fraud rings (tightly connected subgraphs)
    - Hub-and-spoke money laundering structures
    """
    
    def __init__(self, session: Session):
        self.session = session
    
    def detect_communities(self, case_id: str) -> List[Dict]:
        """Detect all communities in a case"""
        
        # Build NetworkX graph from entities and relationships
        graph = self._build_graph(case_id)
        
        if len(graph.nodes()) == 0:
            return []
        
        # Detect communities using Louvain algorithm
        communities_generator = community.louvain_communities(
            graph,
            seed=42  # Reproducible
        )
        
        communities_list = list(communities_generator)
        
        # Analyze each community
        results = []
        for i, comm in enumerate(communities_list):
            if len(comm) < 2:
                continue  # Skip single-node communities
            
            analysis = self._analyze_community(
                graph, comm, case_id, community_id=i
            )
            results.append(analysis)
        
        return results
    
    def _build_graph(self, case_id: str) -> nx.Graph:
        """Build NetworkX graph from entities and relationships"""
        graph = nx.Graph()
        
        # Add entities as nodes
        entities = self.session.query(Entity).filter(
            Entity.case_id == case_id
        ).all()
        
        for entity in entities:
            graph.add_node(entity.id, entity_name=entity.name, entity_type=entity.entity_type)
        
        # Add relationships as edges
        relationships = self.session.query(Relationship).filter(
            Relationship.case_id == case_id
        ).all()
        
        for rel in relationships:
            graph.add_edge(
                rel.source_id,
                rel.target_id,
                relationship_type=rel.relationship_type,
                weight=rel.metadata.get('strength', 1.0) if rel.metadata else 1.0
            )
        
        return graph
    
    def _analyze_community(
        self,
        graph: nx.Graph,
        nodes: set,
        case_id: str,
        community_id: int
    ) -> Dict:
        """Analyze a detected community"""
        
        # Get subgraph for this community
        subgraph = graph.subgraph(nodes)
        
        # Calculate metrics
        density = nx.density(subgraph)
        avg_clustering = nx.average_clustering(subgraph)
        
        # Identify hub nodes (high degree centrality)
        degree_centrality = nx.degree_centrality(subgraph)
        hubs = sorted(
            degree_centrality.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            'community_id': community_id,
            'size': len(nodes),
            'entity_ids': list(nodes),
            'density': density,
            'avg_clustering': avg_clustering,
            'hub_nodes': [hub[0] for hub in hubs],
            'pattern_type': self._classify_pattern(density, avg_clustering),
            'reasoning': self._generate_reasoning(density, len(nodes)),
        }
    
    def _classify_pattern(self, density: float, clustering: float) -> str:
        """Classify the pattern based on metrics"""
        if density > 0.7:
            return 'tightly_connected'  # Fraud ring
        elif density > 0.3:
            return 'moderate_connectivity'
        else:
            return 'sparse'  # Maybe shell network
    
    def _generate_reasoning(self, density: float, size: int) -> str:
        """Generate explanation for the community"""
        if density > 0.7:
            return f'Dense subgraph with {size} entities - potential fraud ring'
        else:
            return f'Isolated cluster with {size} entities - potential shell network'
```

---

## 🟡 PHASE 6C: HIGH-VALUE GAPS (Advanced AI) - 35% COMPLETE

### Feature 6C.1: Local RAG with ChromaDB (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Case memory  
**Effort:** 2 days  
**Files Affected:**  
- `backend/services/local_rag_engine.py` (NEW)  
- `backend/api/ai.py` (ENHANCE)  

**Description:**
Local vector database for cross-case semantic search. "Has this phone number appeared in any 2023 cases?"

---

### Feature 6C.2: Multimodal Vision Analysis (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Forgery detection  
**Effort:** 2.5 days  
**Files Affected:**  
- `backend/services/multimodal_analyzer.py` (ENHANCE)  

**Description:**
Vision transformer for document image analysis, signature matching, forgery detection.

---

### Feature 6C.3: Red Teaming / Devil's Advocate (Backend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 MEDIUM - Challenge assumptions  
**Effort:** 1.5 days  
**Files Affected:**  
- `backend/services/red_team_persona.py` (NEW)  

**Description:**
Dedicated Frenly persona to challenge investigator theories and identify contradictions.

---

### Feature 6C.4: Voice Commands (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 MEDIUM - Accessibility  
**Effort:** 1 day  
**Files Affected:**  
- `frontend/src/hooks/useVoiceCommands.ts` (NEW)  

**Description:**
WebSpeech API integration for hands-free investigation ("Highlight transactions over $10k").

---

## 🟡 PHASE 6D: UI POLISH GAPS - 40% COMPLETE

### Feature 6D.1: Temporal Playback Slider (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Visualization  
**Effort:** 1 day  
**Files Affected:**  
- `frontend/src/components/TemporalPlayback.tsx` (NEW)  

### Feature 6D.2: Case Progress Bar (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - UX clarity  
**Effort:** 0.5 days  

### Feature 6D.3: Investigation Notebook (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Evidence collection  
**Effort:** 1.5 days  

### Feature 6D.4: Digital Dossier (Frontend)

**Current Status:** ❌ NOT IMPLEMENTED  
**Strategic Value:** 🟡 HIGH - Report export  
**Effort:** 1.5 days  

---

## 📋 IMPLEMENTATION PRIORITY MATRIX

| Phase | Features | Effort | Impact | Priority | Timeline |
|-------|----------|--------|--------|----------|----------|
| **6A** | Onboarding (6 items) | 5-7 days | 🔴 CRITICAL | 🔴 P0 | Week 1-2 |
| **6B** | Proof Mechanisms (5 items) | 5-7 days | 🔴 CRITICAL | 🔴 P0 | Week 1-2 parallel |
| **6C** | Advanced AI (4 items) | 8-10 days | 🟡 HIGH | 🟡 P1 | Week 3-4 |
| **6D** | UI Polish (4 items) | 4-5 days | 🟡 HIGH | 🟡 P2 | Week 2-3 parallel |

---

## ✅ SUMMARY & NEXT STEPS

**Total Unimplemented Features:** 27 features (42 across all strategies)

**Effort to Complete All:** 11-16 days development (45+ calendar days with dependencies)

**Quick Wins (<1 day each):**
1. Frenly Welcome Messaging
2. Educational Empty States (enhancement)
3. Case Progress Bar
4. Voice Commands (basic)

**Critical Path:**
1. Role Selection Wizard → Role-Based Layout Presets
2. Rookie Checklist → Track task completion
3. Just-in-Time Tooltips (parallel)
4. Metadata Correlation Engine → Fraud proof mechanisms
5. Temporal Burst Detection → Structuring patterns

**Recommended Approach:**
- **Week 1-2:** Phase 6A (Onboarding) + Phase 6B (Proof Mechanisms) in parallel
- **Week 3:** Phase 6C (Advanced AI) - depends on Phase 6B completion
- **Ongoing:** Phase 6D (UI Polish) - can happen in parallel

---

**Document Created:** 2025-12-11  
**Last Updated:** 2025-12-11T10:30:00+09:00  
**Status:** READY FOR IMPLEMENTATION
