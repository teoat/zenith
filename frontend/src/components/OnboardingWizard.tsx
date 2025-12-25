import React, { useState } from 'react';
import FriendlyWelcome from './FriendlyWelcome';
import RoleSelection from './RoleSelection';
import RookieChecklist from './common/RookieChecklist';
import { JustInTimeTooltip } from './common/JustInTimeTooltip';
import { TourGuide } from './onboarding/TourGuide';
import { Button } from '@/components/ui/Button';
import { PlayCircle } from 'lucide-react';

const OnboardingWizard: React.FC = () => {
  const [showTour, setShowTour] = useState(false);

  return (
    <section data-testid="onboarding-wizard" className="relative">
      <div className="flex justify-between items-start mb-6">
        <FriendlyWelcome name="New User" />
        <Button onClick={() => setShowTour(true)} variant="outline" className="gap-2">
           <PlayCircle className="h-4 w-4" />
           Take Tour
        </Button>
      </div>
      
      <TourGuide 
        isOpen={showTour} 
        onClose={() => setShowTour(false)} 
        onComplete={() => setShowTour(false)} 
      />
      
      <JustInTimeTooltip
        id="role_selection_tip"
        trigger="mount"
        position="right"
        content="Select your primary investigative role to customize your dashboard and tools."
      >
        <RoleSelection />
      </JustInTimeTooltip>

      <div className="mt-8">
        <JustInTimeTooltip
          id="checklist_tip"
          trigger="mount"
          position="top"
          content="Complete your rookie checklist to unlock advanced features and earn your first badge!"
        >
          <RookieChecklist />
        </JustInTimeTooltip>
      </div>
    </section>
  );
};

export default OnboardingWizard;
