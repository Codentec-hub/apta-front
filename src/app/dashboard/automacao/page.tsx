import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { AutomacaoView } from '@/components/dashboard/automacao/automacao-view';

export const metadata = { title: `Agentes e IA | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <AutomacaoView />;
}
