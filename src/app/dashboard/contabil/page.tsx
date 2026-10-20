import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Contábil | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Contábil"
      icone="calculator"
      fase="Fase 3.9 — Contábil avançado"
      descricao="Extratos bancários chegando sozinhos e conferência automática das contas contábeis."
      recursos={[
        'Extratos bancários via Open Finance',
        'Conferência automática das contas contábeis',
        'Validação dos arquivos enviados pelos clientes',
      ]}
      dependencia="Depende da integração Open Finance e com o DominioWeb."
    />
  );
}
