import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EmConstrucao } from '@/components/dashboard/em-construcao';

export const metadata = { title: `Folha de Pagamento | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <EmConstrucao
      titulo="Folha de Pagamento"
      icone="wallet"
      fase="Fase 3.7 — Folha de pagamento"
      descricao="Cálculo da folha e do pró-labore com as transmissões ao governo automatizadas e integradas à contabilidade."
      recursos={[
        'Cálculo da folha e do pró-labore',
        'Transmissão de eSocial, DCTFWeb e FGTS Digital',
        'Provisão de férias e 13º lançada direto na contabilidade',
      ]}
      dependencia="Depende da integração com o eSocial e com o sistema de folha usado hoje."
    />
  );
}
