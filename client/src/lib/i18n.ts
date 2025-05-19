
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        notifications: 'Notifications'
      }
    }
  },
  es: {
    translation: {
      common: {
        dashboard: 'Tablero',
        profile: 'Perfil',
        settings: 'Ajustes',
        notifications: 'Notificaciones'
      }
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
