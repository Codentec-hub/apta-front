import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { UsuariosView } from '@/components/dashboard/usuarios/usuarios-view';

export const metadata = { title: `Usuários | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <UsuariosView />;
}
