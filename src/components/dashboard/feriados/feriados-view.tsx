'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { PODE_ALTERAR_PRAZOS } from '@/lib/obrigacao-status';
import type { Feriado } from '@/types/domain';

import { FeriadoFormDialog } from './feriado-form-dialog';

export function FeriadosView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = Boolean(user && PODE_ALTERAR_PRAZOS.has(user.perfil));

  const [feriados, setFeriados] = React.useState<Feriado[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<Feriado | null>(null);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    api<Feriado[]>('/feriados')
      .then(setFeriados)
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar feriados'))
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo(): void {
    setEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(feriado: Feriado): void {
    setEditando(feriado);
    setDialogAberto(true);
  }

  function aoSalvar(feriado: Feriado, recalculo: { removidas: number; criadas: number }): void {
    setDialogAberto(false);
    carregar();
    setAviso(
      `Feriado salvo — calendário recalculado (${recalculo.removidas} pendência(s) refeita(s), ${recalculo.criadas} gerada(s))`
    );
  }

  async function excluir(feriado: Feriado): Promise<void> {
    if (!globalThis.confirm(`Remover o feriado "${feriado.descricao}"?`)) return;
    try {
      const resultado = await api<{ recalculo: { removidas: number; criadas: number } }>(`/feriados/${feriado.id}`, {
        method: 'DELETE',
      });
      carregar();
      setAviso(
        `Feriado removido — calendário recalculado (${resultado.recalculo.removidas} pendência(s) refeita(s), ${resultado.recalculo.criadas} gerada(s))`
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao remover feriado');
    }
  }

  function escopo(feriado: Feriado): string {
    if (feriado.cidade) return `${feriado.cidade}/${feriado.uf}`;
    if (feriado.uf) return `Estadual · ${feriado.uf}`;
    return 'Nacional';
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Feriados</Typography>
          <Typography color="text.secondary" variant="body2">
            Feriados estaduais e municipais usados no cálculo de prazos (os nacionais já são calculados
            automaticamente). Alterar um feriado refaz as pendências futuras que ainda não foram mexidas.
          </Typography>
        </Stack>
        {podeEditar ? (
          <Button variant="contained" startIcon={<PlusIcon />} onClick={abrirNovo}>
            Novo feriado
          </Button>
        ) : null}
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Abrangência</TableCell>
              <TableCell>Repete todo ano?</TableCell>
              {podeEditar ? <TableCell align="right">Ações</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && feriados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={podeEditar ? 5 : 4}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    Nenhum feriado estadual/municipal cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              feriados.map((feriado) => (
                <TableRow key={feriado.id}>
                  <TableCell>{dayjs(feriado.data).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{feriado.descricao}</TableCell>
                  <TableCell>
                    <Chip label={escopo(feriado)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{feriado.recorrente ? 'Sim' : 'Não'}</TableCell>
                  {podeEditar ? (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => abrirEdicao(feriado)}>
                        <PencilSimpleIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => excluir(feriado)}>
                        <TrashIcon />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <FeriadoFormDialog open={dialogAberto} feriado={editando} onClose={() => setDialogAberto(false)} onSaved={aoSalvar} />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(aviso)} autoHideDuration={5000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity="success" sx={{ width: '100%' }}>
          {aviso}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
