'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';

import type { Perfil } from '@/types/user';
import { useUser } from '@/hooks/use-user';

/** Mostra a página só para os perfis informados (o backend também bloqueia). */
export function ApenasPerfis({
  perfis,
  children,
}: {
  perfis: Perfil[];
  children: React.ReactNode;
}): React.JSX.Element | null {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  if (!user || !perfis.includes(user.perfil)) {
    return (
      <Alert severity="warning" sx={{ maxWidth: 640 }}>
        Seu perfil não tem acesso a esta área. Se precisar, fale com o administrador do sistema.
      </Alert>
    );
  }
  return <>{children}</>;
}
