'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { PlusCircleIcon } from '@phosphor-icons/react/dist/ssr/PlusCircle';

import { api } from '@/lib/api';
import { usePaginacao } from '@/hooks/use-paginacao';
import { datasDeEntrega, OPCOES_COMPETENCIA } from '@/lib/obrigacao-status';
import type { Cliente, Obrigacao, Setor, TipoObrigacao } from '@/types/domain';

import { TipoObrigacaoFormDialog } from './tipo-obrigacao-form-dialog';

export interface CadastroObrigacoesProps {
  setores: Setor[];
  clientes: Cliente[];
  tipos: TipoObrigacao[];
  onTiposChange: (tipos: TipoObrigacao[]) => void;
}

interface MediaTempo {
  mediaMinutos: number;
  amostras: number;
}

function calcularMediasPorTipo(obrigacoes: Obrigacao[]): Map<string, MediaTempo> {
  const somas = new Map<string, { soma: number; amostras: number }>();
  for (const o of obrigacoes) {
    if (!o.tipoId || o.tempoRealMinutos === null) continue;
    const atual = somas.get(o.tipoId) ?? { soma: 0, amostras: 0 };
    atual.soma += o.tempoRealMinutos;
    atual.amostras += 1;
    somas.set(o.tipoId, atual);
  }
  const medias = new Map<string, MediaTempo>();
  for (const [tipoId, { soma, amostras }] of somas) {
    medias.set(tipoId, { mediaMinutos: Math.round(soma / amostras), amostras });
  }
  return medias;
}

const COMPETENCIA_CURTA = new Map(OPCOES_COMPETENCIA.map((o) => [o.value, o.curto]));

// "Relação das Obrigações" do Acessórias: obrigação / departamento / qtde de
// empresas, datas para entrega por mês, multa, competência e lembrete. Aqui
// também o tempo médio real x previsto (produtividade pedida pelo cliente).
export function CadastroObrigacoes({ setores, clientes, tipos, onTiposChange }: CadastroObrigacoesProps): React.JSX.Element {
  const [medias, setMedias] = React.useState<Map<string, MediaTempo>>(new Map());
  const [filtroSetorId, setFiltroSetorId] = React.useState('');
  const [filtroAtiva, setFiltroAtiva] = React.useState<'S' | 'N' | ''>('S');
  const [busca, setBusca] = React.useState('');
  const [editando, setEditando] = React.useState<TipoObrigacao | null>(null);
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<Obrigacao[]>('/obrigacoes?status=entregues')
      .then((obrigacoes) => setMedias(calcularMediasPorTipo(obrigacoes)))
      .catch(() => setMedias(new Map()));
  }, []);

  const visiveis = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return tipos.filter(
      (t) =>
        (!filtroSetorId || t.setorId === filtroSetorId) &&
        (!filtroAtiva || t.ativo === (filtroAtiva === 'S')) &&
        (!termo || t.nome.toLowerCase().includes(termo) || (t.mininome ?? '').toLowerCase().includes(termo))
    );
  }, [tipos, filtroSetorId, filtroAtiva, busca]);

  const { pagina, linhasPorPagina, itensPaginados, aoMudarPagina, aoMudarLinhasPorPagina, resetarPagina } =
    usePaginacao(visiveis, 25);

  React.useEffect(() => {
    resetarPagina();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetar só quando os filtros mudam
  }, [filtroSetorId, filtroAtiva, busca]);

  function aoSalvar(tipo: TipoObrigacao): void {
    const existe = tipos.some((t) => t.id === tipo.id);
    onTiposChange(
      (existe ? tipos.map((t) => (t.id === tipo.id ? tipo : t)) : [...tipos, tipo]).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  function abrir(tipo: TipoObrigacao | null): void {
    setEditando(tipo);
    setDialogAberto(true);
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField label="Filtrar obrigação" size="small" value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ minWidth: 260 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="cad-depto">Departamento</InputLabel>
          <Select labelId="cad-depto" label="Departamento" value={filtroSetorId} onChange={(e) => setFiltroSetorId(e.target.value)}>
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {setores.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="cad-ativa">Ativa?</InputLabel>
          <Select labelId="cad-ativa" label="Ativa?" value={filtroAtiva} onChange={(e) => setFiltroAtiva(e.target.value as 'S' | 'N' | '')}>
            <MenuItem value="">
              <em>Todas</em>
            </MenuItem>
            <MenuItem value="S">Sim</MenuItem>
            <MenuItem value="N">Não</MenuItem>
          </Select>
        </FormControl>
        <Typography color="text.secondary" variant="body2">
          {visiveis.length} reg
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<PlusCircleIcon />} onClick={() => abrir(null)}>
          Nova obrigação
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Obrigação / Departamento</TableCell>
              <TableCell>Qtde empresas</TableCell>
              <TableCell>Datas para entrega (DU = Dia Útil)</TableCell>
              <TableCell>
                Multa?
                <br />
                Tempo prev./real
              </TableCell>
              <TableCell>
                Compet.
                <br />
                Lembrar
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itensPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    Nenhuma obrigação encontrada.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              itensPaginados.map((tipo) => {
                const datas = datasDeEntrega(tipo.entregasPorMes);
                const media = medias.get(tipo.id);
                const acima = media && tipo.tempoPrevistoMinutos !== null && media.mediaMinutos > tipo.tempoPrevistoMinutos;
                return (
                  <TableRow key={tipo.id} hover sx={tipo.ativo ? undefined : { opacity: 0.5 }}>
                    <TableCell>
                      <Link component="button" type="button" onClick={() => abrir(tipo)} sx={{ textAlign: 'left' }}>
                        {tipo.nome}
                      </Link>
                      <Typography color="text.secondary" variant="body2">
                        {tipo.setor.nome}
                        {tipo.mininome ? ` · ${tipo.mininome}` : ''}
                        {tipo.ativo ? '' : ' · inativa'}
                      </Typography>
                    </TableCell>
                    <TableCell>{tipo._count?.empresas ?? 0} empresas</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: 420 }}>
                      {datas.length === 0 ? '—' : datas.join(' ')}
                    </TableCell>
                    <TableCell>
                      {tipo.geraMulta ? 'Sim' : 'Não'}
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {tipo.tempoPrevistoMinutos ?? '—'} min /{' '}
                      </Typography>
                      {media ? (
                        <Tooltip title={`Média de ${media.amostras} entrega(s)`}>
                          <Chip
                            label={`${media.mediaMinutos} min`}
                            size="small"
                            variant="outlined"
                            color={tipo.tempoPrevistoMinutos === null ? 'default' : acima ? 'error' : 'success'}
                          />
                        </Tooltip>
                      ) : (
                        <Typography component="span" variant="caption" color="text.secondary">
                          sem dados
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {COMPETENCIA_CURTA.get(tipo.competenciaReferente) ?? '—'}
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        {tipo.diasAntes} dias antes{tipo.tipoDiasAntes === 'UTEIS' ? ' (úteis)' : ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={visiveis.length}
          page={pagina}
          onPageChange={aoMudarPagina}
          rowsPerPage={linhasPorPagina}
          onRowsPerPageChange={aoMudarLinhasPorPagina}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <TipoObrigacaoFormDialog
        open={dialogAberto}
        tipo={editando}
        setores={setores}
        clientes={clientes}
        onClose={() => setDialogAberto(false)}
        onSaved={aoSalvar}
        onAviso={setAviso}
      />

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity="success" sx={{ width: '100%' }}>
          {aviso}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
