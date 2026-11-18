import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EsqueciSenhaForm } from '@/components/auth/esqueci-senha-form';
import { Layout } from '@/components/auth/layout';

export const metadata = { title: `Esqueci minha senha | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <EsqueciSenhaForm />
    </Layout>
  );
}
