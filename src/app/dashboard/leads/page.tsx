import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { LeadsView } from '@/components/dashboard/leads/leads-view';

export const metadata = { title: `Leads | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <React.Suspense>
      <LeadsView />
    </React.Suspense>
  );
}
