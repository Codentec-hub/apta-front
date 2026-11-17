import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { FeriadosView } from '@/components/dashboard/feriados/feriados-view';

export const metadata = { title: `Feriados | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <FeriadosView />;
}
