import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EscritorioView } from '@/components/dashboard/escritorio/escritorio-view';
import { ApenasPerfis } from '@/components/dashboard/layout/apenas-perfis';

export const metadata = { title: `Escritório | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <ApenasPerfis perfis={['ADMIN', 'GESTOR']}>
      <EscritorioView />
    </ApenasPerfis>
  );
}
