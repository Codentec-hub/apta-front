import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { NotificacoesView } from '@/components/dashboard/notificacoes/notificacoes-view';

export const metadata = { title: `Notificações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <NotificacoesView />;
}
