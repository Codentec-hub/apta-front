import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Financeiro | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Financeiro"
      icone="bank"
      fase="Fase 3.8 — Financeiro"
      descricao="Contas a pagar e a receber do escritório e dos clientes de BPO Financeiro, com DRE e fluxo de caixa no mesmo lugar."
      recursos={[
        'Lançamentos a pagar e a receber, por cliente ou do próprio escritório',
        'DRE simplificado e saldo do mês',
        'Importação automática dos lançamentos do Conta Azul',
      ]}
      dependencia="A importação automática depende da integração com o Conta Azul."
    />
  );
}
