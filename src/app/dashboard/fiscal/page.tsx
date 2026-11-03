import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Fiscal | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Fiscal"
      icone="receipt"
      fase="Fase 3.6 — Automação fiscal"
      descricao="Captura automática de notas fiscais, parcelamentos emitidos em lote e acompanhamento dos certificados digitais, sem precisar entrar cliente por cliente."
      recursos={[
        'XML das notas fiscais capturados automaticamente',
        'Parcelamentos gerados em lote todo fim de mês',
        'Aviso de certificados digitais perto de vencer',
        'Guias enviadas ao cliente pelo WhatsApp assim que forem obtidas',
      ]}
      dependencia="Conexão com o SIEG já autorizada. Falta a integração com o DominioWeb e a construção da sincronização em si."
    />
  );
}
