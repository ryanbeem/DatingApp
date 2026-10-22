// Where the PHP API lives. Override per machine with EXPO_PUBLIC_API_URL in app/.env
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://dating.formoreoptions.com/api').replace(/\/$/, '');
