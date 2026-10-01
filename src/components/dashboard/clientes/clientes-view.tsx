'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
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
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { api } from '@/lib/api';
import { usePaginacao } from '@/hooks/use-paginacao';
import { paths } from '@/paths';
import type { Cliente, Setor, UsuarioResumo } from '@/types/domain';

import { ClienteFormDialog } from './cliente-form-dialog';

export function ClientesView(): React.JSX.Element {
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState('');

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = React.useState<Cliente | null>(null);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    Promise.all([
      api<Cliente[]>('/clientes'),
      api<Setor[]>('/setores'),
      api<UsuarioResumo[]>('/usuarios'),
    ])
      .then(([clientesData, setoresData, usuariosData]) => {
        setClientes(clientesData);
        setSetores(setoresData);
        setUsuarios(usuariosData.filter((u) => u.ativo));
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar dados'))
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const clientesFiltrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return clientes;
    }
    return clientes.filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(termo) ||
        c.cnpj.toLowerCase().includes(termo) ||
        (c.nomeFantasia ?? '').toLowerCase().includes(termo) ||
        (c.apelido ?? '').toLowerCase().includes(termo) ||
        String(c.codigo) === termo.replace(/^0+/, '')
    );
  }, [clientes, busca]);

  const { pagina, linhasPorPagina, itensPaginados, aoMudarPagina, aoMudarLinhasPorPagina, resetarPagina } =
    usePaginacao(clientesFiltrados);

  React.useEffect(() => {
    resetarPagina();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetar só quando o termo de busca muda
  }, [busca]);

  function abrirNovo(): void {
    setClienteEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(cliente: Cliente): void {
    setClienteEmEdicao(cliente);
    setDialogAberto(true);
  }

  function aoSalvar(cliente: Cliente): void {
    setClientes((atual) => {
      const existe = atual.some((c) => c.id === cliente.id);
      const proximo = existe ? atual.map((c) => (c.id === cliente.id ? cliente : c)) : [...atual, cliente];
      return proximo.sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));
    });
    setClienteEmEdicao(cliente);
  }

  async function alternarAtivo(cliente: Cliente): Promise<void> {
    try {
      if (cliente.ativo) {
        await api(`/clientes/${cliente.id}`, { method: 'DELETE' });
        setClientes((atual) => atual.map((c) => (c.id === cliente.id ? { ...c, ativo: false } : c)));
      } else {
        const atualizado = await api<Cliente>(`/clientes/${cliente.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ativo: true }),
        });
        setClientes((atual) => atual.map((c) => (c.id === cliente.id ? atualizado : c)));
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar cliente');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Clientes</Typography>
          <Typography color="text.secondary" variant="body2">
            Cadastro de clientes e empresas, com responsável definido por setor.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={abrirNovo}>
          Novo cliente
        </Button>
      </Stack>

      <TextField
        label="Buscar por razão social ou CNPJ"
        size="small"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        sx={{ maxWidth: 360 }}
      />

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Razão social</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Regime</TableCell>
              <TableCell>Responsáveis</TableCell>
              <TableCell align="center">Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    {clientes.length === 0 ? 'Nenhum cliente cadastrado ainda.' : 'Nenhum cliente encontrado.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              itensPaginados.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    <Link component={RouterLink} href={`${paths.dashboard.clientes}/${cliente.id}`} variant="body2">
                      {cliente.razaoSocial} [{String(cliente.codigo).padStart(3, '0')}]
                    </Link>
                    {cliente.nomeFantasia ? (
                      <Typography color="text.secondary" variant="caption" sx={{ display: 'block' }}>
                        {cliente.nomeFantasia}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{cliente.cnpj}</TableCell>
                  <TableCell>
                    {cliente.cidade ? `${cliente.cidade}${cliente.uf ? ` [${cliente.uf}]` : ''}` : '—'}
                    {cliente.grupoEmpresas ? (
                      <Typography color="text.secondary" variant="caption" sx={{ display: 'block' }}>
                        {cliente.grupoEmpresas}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{cliente.regimeTributario ?? '—'}</TableCell>
                  <TableCell>
                    {cliente.responsaveis.length === 0 ? (
                      <Typography color="text.secondary" variant="caption">
                        —
                      </Typography>
                    ) : (
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {cliente.responsaveis.map((r) => (
                          <Tooltip key={r.id} title={r.usuario.nome}>
                            <Chip label={r.setor.nome} size="small" variant="outlined" />
                          </Tooltip>
                        ))}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={cliente.ativo} onChange={() => alternarAtivo(cliente)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => abrirEdicao(cliente)} size="small">
                      <PencilSimpleIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={clientesFiltrados.length}
          page={pagina}
          onPageChange={aoMudarPagina}
          rowsPerPage={linhasPorPagina}
          onRowsPerPageChange={aoMudarLinhasPorPagina}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <ClienteFormDialog
        open={dialogAberto}
        cliente={clienteEmEdicao}
        setores={setores}
        usuarios={usuarios}
        onClose={() => setDialogAberto(false)}
        onSaved={aoSalvar}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
