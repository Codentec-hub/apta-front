'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
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
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { api } from '@/lib/api';
import type { Setor, UsuarioResumo } from '@/types/domain';

export function SetoresView(): React.JSX.Element {
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [novoNome, setNovoNome] = React.useState('');
  const [criando, setCriando] = React.useState(false);

  const [editandoId, setEditandoId] = React.useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    Promise.all([api<Setor[]>('/setores'), api<UsuarioResumo[]>('/usuarios')])
      .then(([setoresData, usuariosData]) => {
        setSetores(setoresData);
        setUsuarios(usuariosData.filter((u) => u.ativo));
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar setores'))
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  async function criarSetor(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!novoNome.trim()) {
      return;
    }
    setCriando(true);
    try {
      const setor = await api<Setor>('/setores', {
        method: 'POST',
        body: JSON.stringify({ nome: novoNome.trim() }),
      });
      setSetores((atual) => [...atual, setor].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar setor');
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(setor: Setor): void {
    setEditandoId(setor.id);
    setNomeEdicao(setor.nome);
  }

  async function salvarEdicao(id: string): Promise<void> {
    if (!nomeEdicao.trim()) {
      return;
    }
    setSalvando(true);
    try {
      const setor = await api<Setor>(`/setores/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: nomeEdicao.trim(), responsavelId: setores.find((s) => s.id === id)?.responsavelId ?? null }),
      });
      setSetores((atual) => atual.map((s) => (s.id === id ? setor : s)).sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditandoId(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar setor');
    } finally {
      setSalvando(false);
    }
  }

  // Responsável padrão do departamento (como "Pessoal - Maria Alice" no
  // Acessórias): assume as entregas sem responsável definido na empresa.
  async function definirResponsavel(setor: Setor, responsavelId: string): Promise<void> {
    try {
      const atualizado = await api<Setor>(`/setores/${setor.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: setor.nome, responsavelId: responsavelId || null }),
      });
      setSetores((atual) => atual.map((s) => (s.id === setor.id ? atualizado : s)));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar responsável');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Setores</Typography>
        <Typography color="text.secondary" variant="body2">
          Departamentos do escritório (fiscal, folha, contábil, financeiro, atendimento). O responsável padrão assume
          as entregas quando a empresa não tem responsável definido naquele departamento.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack component="form" direction="row" spacing={2} onSubmit={criarSetor}>
          <TextField
            label="Novo setor"
            size="small"
            value={novoNome}
            onChange={(event) => setNovoNome(event.target.value)}
            sx={{ flex: 1, maxWidth: 320 }}
          />
          <Button type="submit" variant="contained" disabled={criando} startIcon={<PlusIcon />}>
            Adicionar
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Responsável padrão</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && setores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    Nenhum setor cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              setores.map((setor) => (
                <TableRow key={setor.id}>
                  <TableCell>
                    {editandoId === setor.id ? (
                      <TextField
                        size="small"
                        value={nomeEdicao}
                        onChange={(event) => setNomeEdicao(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      setor.nome
                    )}
                  </TableCell>
                  <TableCell sx={{ width: 280 }}>
                    <Select
                      size="small"
                      fullWidth
                      displayEmpty
                      value={setor.responsavelId ?? ''}
                      onChange={(event) => definirResponsavel(setor, event.target.value)}
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {usuarios.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    {editandoId === setor.id ? (
                      <>
                        <IconButton disabled={salvando} onClick={() => salvarEdicao(setor.id)} size="small">
                          <CheckIcon />
                        </IconButton>
                        <IconButton disabled={salvando} onClick={() => setEditandoId(null)} size="small">
                          <XIcon />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton onClick={() => iniciarEdicao(setor)} size="small">
                        <PencilSimpleIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
