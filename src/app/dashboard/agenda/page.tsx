import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { AgendaView } from '@/components/dashboard/agenda/agenda-view';

export const metadata = { title: `Agenda | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <React.Suspense>
      <AgendaView />
    </React.Suspense>
  );
}
