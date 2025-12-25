import React from 'react';

type Props = { name?: string };

const FrienlyWelcome: React.FC<Props> = ({ name }) => {
  return (
    <header data-testid="frienly-welcome">
      <h1>Welcome{ name ? `, ${name}` : '' } — Frenly</h1>
      <p>We're glad you're here. This welcome component is used in onboarding quick wins.</p>
    </header>
  );
};

export default FrienlyWelcome;
