import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Automação e IA | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Automação e IA"
      icone="robot"
      fase="Fase 3.10 — Inteligência e automação"
      descricao="Inteligência artificial trabalhando sobre os dados do escritório: mensagens automáticas, respostas às dúvidas mais comuns e alertas antes de algo atrasar."
      recursos={[
        'Mensagens recorrentes (ex.: "virou o mês, envie os extratos e as despesas")',
        'Agente Apta respondendo as dúvidas mais comuns dos clientes',
        'Sinais de risco de atraso e de produtividade por setor',
      ]}
    />
  );
}
