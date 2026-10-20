import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Integrações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Integrações"
      icone="plugs-connected"
      fase="Fase 3.1 — Fundação técnica"
      descricao="Conexão com as ferramentas que o escritório usa hoje, para os dados entrarem no sistema sem digitação."
      recursos={[
        'WhatsApp: conversas do atendimento e envio de guias',
        'SIEG e DominioWeb',
        'Conta Azul',
        'E-mail para envio de protocolos e lembretes',
      ]}
      dependencia="Cada integração é ativada depois do levantamento da API disponível em cada ferramenta."
    />
  );
}
