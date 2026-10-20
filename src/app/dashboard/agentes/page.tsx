import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { AgentesView } from '@/components/dashboard/agentes/agentes-view';

export const metadata = { title: `Agentes de IA | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <AgentesView />;
}
