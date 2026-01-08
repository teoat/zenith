import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../providers/LocaleProvider';
import { LOCALE_DISPLAY_NAMES, SupportedLocale } from '../../../types/locale';
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
                        onClick={() => setCurrentTheme('light')}
                        className="flex items-center gap-2"
                    >
                        <Sun className="h-4 w-4" />
                        {t('settings.theme.light')}
                    </Button>
                    <Button
                        variant={currentTheme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setCurrentTheme('dark')}
                        className="flex items-center gap-2"
                    >
                        <Moon className="h-4 w-4" />
                        {t('settings.theme.dark')}
                    </Button>
                    <Button
                        variant={currentTheme === 'system' ? 'default' : 'outline'}
                        onClick={() => setCurrentTheme('system')}
                        className="flex items-center gap-2"
                    >
                        <Monitor className="h-4 w-4" />
                        {t('settings.theme.system')}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(LOCALE_DISPLAY_NAMES).map(([locale, displayName]) => (
                        <Button
                            key={locale}
                            variant={settings.locale === locale ? 'default' : 'outline'}
                            onClick={() => setLocale(locale as SupportedLocale)}
                            className="justify-start"
                        >
                            {displayName}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
