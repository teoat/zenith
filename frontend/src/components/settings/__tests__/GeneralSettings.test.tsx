import { render, screen } from '@testing-library/react';
import GeneralSettings from '../GeneralSettings';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock the useUpdateSettings hook
jest.mock('../../../hooks/useSettings', () => ({
  useUpdateSettings: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

// Mock the LanguageSwitcher component
jest.mock('../i18n/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

describe('GeneralSettings', () => {
  const mockSettings = {
    theme: 'light',
    language: 'en',
    autoSave: true,
    notifications: true,
    maxFileSize: 10,
  };

  it('renders settings form with translated labels', () => {
    render(<GeneralSettings settings={mockSettings} />);

    // Check that the component renders
    expect(screen.getByText('general.title')).toBeInTheDocument();
    expect(screen.getByText('general.description')).toBeInTheDocument();
    expect(screen.getByText('general.theme.label')).toBeInTheDocument();
    expect(screen.getByText('general.language.label')).toBeInTheDocument();
  });

  it('renders language switcher component', () => {
    render(<GeneralSettings settings={mockSettings} />);

    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('renders theme selector with correct options', () => {
    render(<GeneralSettings settings={mockSettings} />);

    const select = screen.getByDisplayValue('general.theme.light');
    expect(select).toBeInTheDocument();
  });
});