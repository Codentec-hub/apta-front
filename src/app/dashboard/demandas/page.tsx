import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Demandas | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Demandas"
      icone="kanban"
      fase="Fase 3.4 — Demandas"
      descricao="Quadro por setor para o trabalho que não é rotina (planejamento tributário, estudo de viabilidade, abertura de empresa), ligado à ficha do cliente, no lugar do Trello."
      recursos={[
        'Kanban por setor, com arrastar e soltar entre etapas',
        'Cada demanda vinculada a um cliente e a um responsável',
        'Prazos e alerta do que está parado há muito tempo',
      ]}
    />
  );
}
