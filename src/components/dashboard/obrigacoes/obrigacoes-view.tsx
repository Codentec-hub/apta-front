'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import type { Cliente, ConjuntoObrigacoes, Setor, TipoObrigacao, UsuarioResumo } from '@/types/domain';

import { CadastroObrigacoes } from './cadastro-obrigacoes';
import { ConjuntosObrigacoes } from './conjuntos-obrigacoes';
import { ListaEntregas } from './lista-entregas';

type Aba = 'entregas' | 'cadastro' | 'regimes' | 'grupos';

export interface DadosBase {
  clientes: Cliente[];
  setores: Setor[];
  tipos: TipoObrigacao[];
  usuarios: UsuarioResumo[];
}

// Módulo de Obrigações no modelo do Acessórias: a Lista de Entregas (o dia a
// dia) e os cadastros que decidem o que cada empresa entrega por competência.
export function ObrigacoesView(): React.JSX.Element {
  const [aba, setAba] = React.useState<Aba>('entregas');
  const [dados, setDados] = React.useState<DadosBase>({ clientes: [], setores: [], tipos: [], usuarios: [] });
  const [regimes, setRegimes] = React.useState<ConjuntoObrigacoes[]>([]);
  const [grupos, setGrupos] = React.useState<ConjuntoObrigacoes[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<Cliente[]>('/clientes'),
      api<Setor[]>('/setores'),
      api<TipoObrigacao[]>('/tipos-obrigacao'),
      api<UsuarioResumo[]>('/usuarios'),
      api<ConjuntoObrigacoes[]>('/regimes'),
      api<ConjuntoObrigacoes[]>('/grupos-obrigacao'),
    ])
      .then(([clientes, setores, tipos, usuarios, regimesData, gruposData]) => {
        setDados({ clientes, setores, tipos, usuarios: usuarios.filter((u) => u.ativo) });
        setRegimes(regimesData);
        setGrupos(gruposData);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar dados'));
  }, []);

  const setTipos = React.useCallback((tipos: TipoObrigacao[]) => setDados((d) => ({ ...d, tipos })), []);

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Obrigações</Typography>
        <Typography color="text.secondary" variant="body2">
          Entregas geradas mês a mês pelo cadastro de cada obrigação e empresa, com prazo técnico e legal, e
          acompanhamento do plano de ação quando algo atrasa.
        </Typography>
      </Stack>

      <Tabs value={aba} onChange={(_event, valor: Aba) => setAba(valor)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="entregas" label="Lista de entregas" />
        <Tab value="cadastro" label="Relação das obrigações" />
        <Tab value="regimes" label="Regimes tributários" />
        <Tab value="grupos" label="Grupos de obrigações" />
      </Tabs>

      {aba === 'entregas' ? <ListaEntregas dados={dados} onErro={setErro} /> : null}
      {aba === 'cadastro' ? (
        <CadastroObrigacoes setores={dados.setores} clientes={dados.clientes} tipos={dados.tipos} onTiposChange={setTipos} />
      ) : null}
      {aba === 'regimes' ? (
        <ConjuntosObrigacoes
          tipo="regime"
          conjuntos={regimes}
          tipos={dados.tipos}
          onChange={setRegimes}
          onErro={setErro}
        />
      ) : null}
      {aba === 'grupos' ? (
        <ConjuntosObrigacoes tipo="grupo" conjuntos={grupos} tipos={dados.tipos} onChange={setGrupos} onErro={setErro} />
      ) : null}

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
