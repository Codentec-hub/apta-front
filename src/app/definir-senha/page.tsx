import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { DefinirSenhaForm } from '@/components/auth/definir-senha-form';
import { Layout } from '@/components/auth/layout';

export const metadata = { title: `Criar senha | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <React.Suspense fallback={null}>
        <DefinirSenhaForm />
      </React.Suspense>
    </Layout>
  );
}
