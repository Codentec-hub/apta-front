import { getSiteURL } from '@/lib/get-site-url';
import { LogLevel } from '@/lib/logger';

export interface Config {
  site: { name: string; description: string; themeColor: string; url: string };
  apiUrl: string;
  logLevel: keyof typeof LogLevel;
}

export const config: Config = {
  site: {
    name: 'Sistema Apta',
    description: 'Plataforma interna da Apta Contabilidade',
    themeColor: '#2f83c4',
    url: getSiteURL(),
  },
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) ?? LogLevel.ALL,
};
