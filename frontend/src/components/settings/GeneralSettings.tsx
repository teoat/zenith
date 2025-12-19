import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateSettings } from '../../hooks/useSettings';
import { AccessibleButton } from '../ui/AccessibleButton';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import type { UserSettings } from '../../hooks/useSettings';

interface GeneralSettingsProps {
  settings: UserSettings;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings }) => {
  const { t } = useTranslation('settings');
  const updateMutation = useUpdateSettings();
  const [formData, setFormData] = React.useState({
    theme: settings.theme,
    language: settings.language,
    autoSave: settings.autoSave,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  // Progressive validation
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'theme':
        if (!['light', 'dark', 'system'].includes(value)) {
          newErrors.theme = 'Please select a valid theme';
        } else {
          delete newErrors.theme;
        }
        break;
      case 'language':
        if (!['en', 'id'].includes(value)) {
          newErrors.language = 'Please select a valid language';
        } else {
          delete newErrors.language;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Progressive validation - validate as user types
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleFieldBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof typeof formData]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched for final validation
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate all fields
    Object.entries(formData).forEach(([key, value]) => {
      validateField(key, value);
    });

    // Submit if no errors
    if (Object.keys(errors).length === 0) {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('general.title')}</h2>
        <p className="text-sm text-gray-600">{t('general.description')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
              {t('general.theme.label')}
            </label>
            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={(e) => handleFieldChange('theme', e.target.value)}
              onBlur={() => handleFieldBlur('theme')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.theme ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="light">{t('general.theme.light')}</option>
              <option value="dark">{t('general.theme.dark')}</option>
              <option value="system">{t('general.theme.system')}</option>
            </select>
            {touched.theme && errors.theme && (
              <p className="mt-1 text-sm text-red-600">{errors.theme}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('general.language.label')}
            </label>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="autoSave"
            name="autoSave"
            type="checkbox"
            defaultChecked={settings.autoSave}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-900">
            Enable auto-save
          </label>
        </div>

        <div className="pt-4">
          <AccessibleButton
            type="submit"
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {updateMutation.isPending ? t('messages.saving') : t('actions.save')}
          </AccessibleButton>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettings;