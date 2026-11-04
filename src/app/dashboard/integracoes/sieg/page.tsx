import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { SiegEmpresasView } from '@/components/dashboard/integracoes/sieg-empresas-view';

export const metadata = { title: `Empresas na SIEG | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <SiegEmpresasView />;
}
