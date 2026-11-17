import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { ConfigLeadsView } from '@/components/dashboard/leads/config-leads-view';

export const metadata = { title: `Leads e agendamento | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <ConfigLeadsView />;
}
