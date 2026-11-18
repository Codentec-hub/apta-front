'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import type { SxProps, Theme } from '@mui/material/styles';

import { config } from '@/config';

export function iniciais(nome?: string | null): string {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes.at(-1)?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/** URL da foto de perfil (com a versão, para o navegador não mostrar a antiga). */
export function fotoDoUsuario(u: { id: string; fotoEm?: string | null } | null | undefined): string | undefined {
  if (!u?.fotoEm) return undefined;
  return `${config.apiUrl}/usuarios/${u.id}/foto?v=${new Date(u.fotoEm).getTime()}`;
}

/** Foto de perfil; sem foto (ou se não carregar), as iniciais do nome. */
export function AvatarUsuario({
  usuario,
  tamanho = 40,
  sx,
}: {
  usuario: { id: string; nome?: string | null; fotoEm?: string | null } | null | undefined;
  tamanho?: number;
  sx?: SxProps<Theme>;
}): React.JSX.Element {
  return (
    <Avatar
      src={fotoDoUsuario(usuario)}
      alt={usuario?.nome ?? ''}
      sx={[
        { width: tamanho, height: tamanho, fontSize: tamanho * 0.4, bgcolor: 'var(--mui-palette-primary-main)' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {iniciais(usuario?.nome)}
    </Avatar>
  );
}
