import { useState, useMemo } from 'react';
import { api } from '../lib/api';
import { Settings as SettingsIcon, Save, RefreshCw, History, Activity, Shield, Bell, Globe, Layers, Eye } from 'lucide-react';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { AccessibleForm } from '../components/ui/AccessibleForm';
import { accessibilityManager } from '../lib/accessibility';
import { useToast } from '../providers/ToastProvider';
import AuditLogViewer from '../components/settings/AuditLogViewer';
import HealthGauges from '../components/settings/HealthGauges';
import { PermissionMatrix } from '../components/settings/PermissionMatrix';
import RuleBuilder from '../components/settings/RuleBuilder';
import { useLocale } from '../providers/LocaleProvider';
import { LOCALE_DISPLAY_NAMES, SupportedLocale } from '../types/locale';
import { getCommonTimezones, getBrowserTimezone } from '../lib/formatters';
import { AccessibilitySettings } from '../components/accessibility/AccessibilitySettings';

type Tab = 'general' | 'notifications' | 'security' | 'detection' | 'system' | 'accessibility';


const Settings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { settings: localeSettings, setLocale, setTimezone } = useLocale();
  const { addToast } = useToast();
  
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    autoSave: false,
    maxFileSize: '10'
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // Get timezone options
  const timezoneOptions = useMemo(() => {
    const timezones = getCommonTimezones();
    return timezones.map(tz => ({
      value: tz,
      label: tz.replace(/_/g, ' ').replace('/', ' / ')
    }));
  }, []);

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to backend
      await api.saveUserPreferences({
        ...settings,
        locale: localeSettings,
      });
      addToast('Settings saved successfully', 'success');
      accessibilityManager.announce('Settings saved successfully', 'polite');
    } catch (_error) {
      console.error('Failed to save settings:', error);
      accessibilityManager.announce('Failed to save settings', 'assertive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      theme: 'dark',
      notifications: true,
      autoSave: false,
      maxFileSize: '10'
    });
    setLocale('en-US');
    setTimezone(getBrowserTimezone());
    accessibilityManager.announce('Settings reset to defaults', 'polite');
  };

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: SettingsIcon },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'detection' as Tab, label: 'Detection Logic', icon: Layers },
    { id: 'accessibility' as Tab, label: 'Accessibility', icon: Eye },
    { id: 'system' as Tab, label: 'System', icon: Activity },
  ];

  const themeOptions = [
    { value: 'dark', label: 'Dark Theme' },
    { value: 'light', label: 'Light Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  const languageOptions = (Object.entries(LOCALE_DISPLAY_NAMES) as [SupportedLocale, string][]).map(
    ([value, label]) => ({ value, label })
  );

  const settingsFields = [
    {
      name: 'theme',
      label: 'Theme',
      type: 'select' as const,
      options: themeOptions,
      validation: { required: 'Please select a theme' }
    },
    {
      name: 'language',
      label: 'Language',
      type: 'select' as const,
      options: languageOptions,
      validation: { required: 'Please select a language' }
    },
    {
      name: 'maxFileSize',
      label: 'Maximum File Size (MB)',
      type: 'number' as const,
      validation: {
        required: 'Maximum file size is required',
        minLength: { value: 1, message: 'File size must be at least 1MB' },
        maxLength: { value: 3, message: 'File size cannot exceed 999MB' }
      }
    }
  ];

  return (
    <div className="page">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 mt-1">Configure application preferences and system options</p>
      </header>

      {/* Tabbed Navigation */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="settings-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div id="panel-general" role="tabpanel" aria-labelledby="tab-general" className="animate-fadeIn">
            <section aria-labelledby="general-settings-heading">
              <h2 id="general-settings-heading" className="text-lg font-bold mb-4">General Settings</h2>

              <AccessibleForm
                fields={settingsFields}
                onSubmit={(data) => {
                  Object.entries(data).forEach(([key, value]) => {
                    handleSettingChange(key, value);
                  });
                  handleSaveSettings();
                }}
                submitLabel="Save Settings"
                loading={isSaving}
                className="settings-form"
              />

              <div className="additional-settings mt-6 space-y-4">
                <div className="setting-item flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <label htmlFor="auto-save-toggle" className="setting-label font-medium">
                    Auto-save Changes
                  </label>
                  <input
                    id="auto-save-toggle"
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="w-5 h-5 rounded"
                    aria-describedby="auto-save-description"
                  />
                </div>
              </div>
              
              {/* Locale & Regional Settings */}
              <div className="mt-8">
                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" />
                  Regional Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Language Selection */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <label htmlFor="language-select" className="font-medium block">Language</label>
                      <p className="text-sm text-slate-500">Display language for the application</p>
                    </div>
                    <select
                      id="language-select"
                      value={localeSettings.locale}
                      onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm min-w-[180px]"
                      aria-label="Select language"
                    >
                      {languageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Timezone Selection */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <label htmlFor="timezone-select" className="font-medium block">Timezone</label>
                      <p className="text-sm text-slate-500">All dates and times will be displayed in this timezone</p>
                    </div>
                    <select
                      id="timezone-select"
                      value={localeSettings.timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm min-w-[220px]"
                      aria-label="Select timezone"
                    >
                      {timezoneOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Notification Tab Content ... */}
        {activeTab === 'notifications' && (
          <div id="panel-notifications" role="tabpanel" aria-labelledby="tab-notifications" className="animate-fadeIn">
            <section aria-labelledby="notifications-heading">
              <h2 id="notifications-heading" className="text-lg font-bold mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <label htmlFor="notifications-toggle" className="font-medium block">Enable Notifications</label>
                    <p className="text-sm text-slate-500">Receive alerts for important events</p>
                  </div>
                  <input
                    id="notifications-toggle"
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <label htmlFor="email-notifications" className="font-medium block">Email Notifications</label>
                    <p className="text-sm text-slate-500">Receive daily digest via email</p>
                  </div>
                  <input id="email-notifications" type="checkbox" className="w-5 h-5 rounded" />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <label htmlFor="critical-alerts" className="font-medium block">Critical Alerts Only</label>
                    <p className="text-sm text-slate-500">Only notify for high-priority items</p>
                  </div>
                  <input id="critical-alerts" type="checkbox" className="w-5 h-5 rounded" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" className="animate-fadeIn">
            <section aria-labelledby="rbac-heading" className="mb-8">
               <PermissionMatrix />
            </section>

            <section aria-labelledby="audit-log-heading">
              <h2 id="audit-log-heading" className="text-lg font-bold flex items-center gap-2 mb-4">
                <History size={20} className="text-blue-500" />
                Audit Log
              </h2>
              <AuditLogViewer />
            </section>
          </div>
        )}

        {/* Detection Logic Tab */}
        {activeTab === 'detection' && (
          <div id="panel-detection" role="tabpanel" aria-labelledby="tab-detection" className="animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Fraud Detection Rules</h2>
              <p className="text-slate-500">Configure automated logic for flagging suspicious transactions.</p>
            </div>
            <RuleBuilder />
          </div>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <div id="panel-accessibility" role="tabpanel" aria-labelledby="tab-accessibility" className="animate-fadeIn">
            <section aria-labelledby="accessibility-heading" className="mb-8">
              <h2 id="accessibility-heading" className="text-lg font-bold flex items-center gap-2 mb-4">
                <Eye size={20} className="text-blue-500" />
                Accessibility Settings
              </h2>
              <p className="text-slate-500 mb-6">Customize the application to meet your accessibility needs.</p>
              <AccessibilitySettings />
            </section>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div id="panel-system" role="tabpanel" aria-labelledby="tab-system" className="animate-fadeIn">
            <section aria-labelledby="health-heading" className="mb-8">
              <h2 id="health-heading" className="text-lg font-bold flex items-center gap-2 mb-4">
                <Activity size={20} className="text-green-500" />
                System Health
              </h2>
              <HealthGauges />
            </section>

            <section aria-labelledby="system-info-heading">
              <h2 id="system-info-heading" className="text-lg font-bold mb-4">System Information</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-500 block">Version</span>
                  <span className="text-lg font-bold">1.0.0</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-500 block">Database</span>
                  <span className="text-lg font-bold text-green-600">Connected</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-500 block">Memory Usage</span>
                  <span className="text-lg font-bold">245 MB</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Actions */}
      <section className="settings-actions mt-8 flex gap-3" aria-label="Settings actions">
        <AccessibleButton
          onClick={handleSaveSettings}
          disabled={isSaving}
          loading={isSaving}
          loadingText="Saving settings..."
          variant="primary"
        >
          <Save size={16} aria-hidden="true" />
          Save All Settings
        </AccessibleButton>

        <AccessibleButton
          onClick={handleResetSettings}
          variant="secondary"
          aria-describedby="reset-description"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Reset to Defaults
        </AccessibleButton>
      </section>
    </div>
  );
};

export default Settings;