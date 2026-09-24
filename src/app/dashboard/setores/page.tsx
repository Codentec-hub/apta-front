import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { SetoresView } from '@/components/dashboard/setores/setores-view';

export const metadata = { title: `Setores | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <SetoresView />;
}
