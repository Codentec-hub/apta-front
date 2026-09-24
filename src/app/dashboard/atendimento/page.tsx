import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { AtendimentosView } from '@/components/dashboard/atendimento/atendimentos-view';

export const metadata = { title: `Atendimento | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <AtendimentosView />;
}
