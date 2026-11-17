import * as React from 'react';

import { ConfiguracoesLayout } from '@/components/dashboard/configuracoes/configuracoes-layout';

/** Todas as páginas de configuração (mesmas URLs) dentro de um layout com menu lateral. */
export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <ConfiguracoesLayout>{children}</ConfiguracoesLayout>;
}
