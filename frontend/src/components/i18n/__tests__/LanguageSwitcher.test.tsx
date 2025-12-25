import { render, screen } from '@testing-library/react';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

describe('LanguageSwitcher', () => {
  it('renders language selector with all supported languages', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check that all language options are present
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
    expect(screen.getByText('🇮🇩 Bahasa Indonesia')).toBeInTheDocument();
  });

  it('displays current language as selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('en');
  });

  it('has proper accessibility attributes', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label');
  });
});