import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmailsClienteView } from '@/components/dashboard/emails-cliente/emails-cliente-view';

export const metadata = { title: `E-mails ao cliente | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <EmailsClienteView />;
}
