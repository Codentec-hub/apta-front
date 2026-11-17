import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { SaudeIntegracaoSieg } from '@/components/dashboard/integracoes/saude-integracao-sieg';

export const metadata = { title: `Integração SIEG | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <SaudeIntegracaoSieg />;
}
