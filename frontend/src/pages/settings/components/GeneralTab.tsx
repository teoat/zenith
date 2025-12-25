
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../providers/LocaleProvider';
import type { SupportedLocale } from '../../../types/locale';
import { LOCALE_DISPLAY_NAMES } from '../../../types/locale';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { usePersistedState } from '../../../hooks/usePersistedState';

const GeneralTab: React.FC = () => {
    const { t } = useTranslation();
    const { settings, setLocale } = useLocale();
    const [currentTheme, setCurrentTheme] = usePersistedState<'light' | 'dark' | 'system'>('app_theme', 'system');

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('settings.appearance')}</h3>
                <div className="flex gap-4">
                    <Button
                        variant={currentTheme === 'light' ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => setCurrentTheme('light')}
                    >
                        <Sun size={16} /> {t('settings.theme.light')}
                    </Button>
                    <Button
                        variant={currentTheme === 'dark' ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => setCurrentTheme('dark')}
                    >
                        <Moon size={16} /> {t('settings.theme.dark')}
                    </Button>
                    <Button
                        variant={currentTheme === 'system' ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => setCurrentTheme('system')}
                    >
                        <Monitor size={16} /> {t('settings.theme.system')}
                    </Button>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t dark:border-slate-800">
                <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                <div className="flex gap-4 items-center">
                    <select
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 min-w-[200px]"
                        value={settings.locale}
                        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                    >
                        {Object.entries(LOCALE_DISPLAY_NAMES).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-500">
                        ({t('settings.localeChangesApply')})
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
