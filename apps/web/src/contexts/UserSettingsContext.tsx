import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface UserSettings {
  allowProfileDiscovery: boolean;
  allowLocationVisibility: boolean;
  offersNotifications: boolean;
  journeyNotifications: boolean;
  teamNotifications: boolean;
  customizedAds: boolean;
  dataImprovement: boolean;
}

const defaultSettings: UserSettings = {
  allowProfileDiscovery: true,
  allowLocationVisibility: true,
  offersNotifications: true,
  journeyNotifications: true,
  teamNotifications: true,
  customizedAds: false,
  dataImprovement: true,
};

interface UserSettingsContextType {
  settings: UserSettings;
  updateSetting: (key: keyof UserSettings, value: boolean) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [initialized, setInitialized] = useState(false);

  // Storage key scoped to user
  const getStorageKey = () => user ? `ekana_user_settings_${user.id}` : null;

  // Initialize from localStorage on mount or user change
  useEffect(() => {
    setInitialized(false); // Reset on user change to prevent stale state flash
    const storageKey = getStorageKey();
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.warn("Invalid stored user settings. Resetting.", e);
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
    setInitialized(true);
  }, [user?.id]);

  // Persist to localStorage whenever settings change (after initialization)
  useEffect(() => {
    if (!initialized) return;
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    }
  }, [settings, initialized, user?.id]);

  const updateSetting = (key: keyof UserSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <UserSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </UserSettingsContext.Provider>
  );
};
