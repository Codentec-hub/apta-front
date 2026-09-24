import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { DemandasView } from '@/components/dashboard/demandas/demandas-view';

export const metadata = { title: `Demandas | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <DemandasView />;
}
