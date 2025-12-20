import React from 'react';
import FrienlyWelcome from './FrienlyWelcome';
import RoleSelection from './RoleSelection';
import RookieChecklist from './RookieChecklist';

const OnboardingWizard: React.FC = () => {
  return (
    <section data-testid="onboarding-wizard">
      <FrienlyWelcome name="New User" />
      <RoleSelection />
      <RookieChecklist />
    </section>
  );
};

export default OnboardingWizard;
