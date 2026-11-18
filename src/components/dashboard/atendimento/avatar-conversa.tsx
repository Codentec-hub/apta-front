'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';

import { config } from '@/config';
import { getToken } from '@/lib/api';

import { iniciais } from './util';

// A rota da foto exige login (é foto de cliente), então baixa com o token e
// guarda o blob por conversa+versão enquanto a página estiver aberta.
const cache = new Map<string, Promise<string | null>>();

function carregarFoto(conversaId: string, versao: string): Promise<string | null> {
  const chave = `${conversaId}:${versao}`;
  let pedido = cache.get(chave);
  if (!pedido) {
    const token = getToken();
    pedido = fetch(`${config.apiUrl}/conversas/${conversaId}/foto?v=${encodeURIComponent(versao)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => (res.ok ? URL.createObjectURL(await res.blob()) : null))
      .catch(() => null);
    cache.set(chave, pedido);
  }
  return pedido;
}

interface Props {
  conversaId: string;
  fotoEm: string | null;
  titulo: string;
  tamanho?: number;
  cor?: string; // fundo das iniciais quando não há foto
}

export function AvatarConversa({ conversaId, fotoEm, titulo, tamanho = 40, cor = 'primary.main' }: Props): React.JSX.Element {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSrc(null);
    if (!fotoEm) return;
    let ativo = true;
    void carregarFoto(conversaId, fotoEm).then((url) => {
      if (ativo) setSrc(url);
    });
    return () => {
      ativo = false;
    };
  }, [conversaId, fotoEm]);

  return (
    <Avatar
      src={src ?? undefined}
      alt={titulo}
      sx={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.35), bgcolor: src ? undefined : cor }}
    >
      {iniciais(titulo)}
    </Avatar>
  );
}
