import React from 'react';
import FriendlyWelcome from './FriendlyWelcome';
import RoleSelection from './RoleSelection';
import RookieChecklist from './common/RookieChecklist';

const OnboardingWizard: React.FC = () => {
  return (
    <section data-testid="onboarding-wizard">
      <FriendlyWelcome name="New User" />
      <RoleSelection />
      <RookieChecklist />
    </section>
  );
};

export default OnboardingWizard;
