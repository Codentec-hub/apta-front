import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { FinanceiroView } from '@/components/dashboard/financeiro/financeiro-view';

export const metadata = { title: `Financeiro | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <FinanceiroView />;
}
