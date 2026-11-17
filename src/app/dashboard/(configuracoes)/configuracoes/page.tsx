'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@/hooks/use-user';
import { itensDoPerfil, settingsNavItems } from '@/components/dashboard/layout/config';

/** /dashboard/configuracoes abre a primeira página que o perfil pode ver. */
export default function Page(): React.JSX.Element | null {
  const router = useRouter();
  const { user, isLoading } = useUser();
  React.useEffect(() => {
    if (isLoading) return;
    const primeira = itensDoPerfil(settingsNavItems, user?.perfil)[0];
    router.replace(primeira?.href ?? '/dashboard');
  }, [isLoading, user?.perfil, router]);
  return null;
}
