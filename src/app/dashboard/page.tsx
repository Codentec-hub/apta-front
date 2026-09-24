import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { Overview } from '@/components/dashboard/overview/overview';

export const metadata = { title: `Painel geral | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <Overview />;
}
