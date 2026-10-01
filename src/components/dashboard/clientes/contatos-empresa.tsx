'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { api } from '@/lib/api';
import type { ContatoCliente, Setor } from '@/types/domain';

// "Todos" = recebe documentos de todos os departamentos.
const TODOS = '__todos__';

interface FormContato {
  nome: string;
  cargo: string;
  celular: string;
  email: string;
  recebe: string[]; // [TODOS] ou ids de setor
}

const VAZIO: FormContato = { nome: '', cargo: '', celular: '', email: '', recebe: [TODOS] };

export interface ContatosEmpresaProps {
  clienteId: string;
  setores: Setor[];
  onChange?: (contatos: ContatoCliente[]) => void;
}

// "Contatos na empresa" do Acessórias: quem recebe o quê (folha → pessoa X,
// impostos → pessoa Y, ou todos recebem tudo).
export function ContatosEmpresa({ clienteId, setores, onChange }: ContatosEmpresaProps): React.JSX.Element {
  const [contatos, setContatos] = React.useState<ContatoCliente[]>([]);
  const [form, setForm] = React.useState<FormContato>(VAZIO);
  const [editandoId, setEditandoId] = React.useState<string | null>(null);
  const [aberto, setAberto] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  const atualizar = React.useCallback(
    (lista: ContatoCliente[]) => {
      setContatos(lista);
      onChange?.(lista);
    },
    [onChange]
  );

  React.useEffect(() => {
    api<ContatoCliente[]>(`/clientes/${clienteId}/contatos`)
      .then(setContatos)
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar contatos'));
  }, [clienteId]);

  function editar(contato: ContatoCliente | null): void {
    setErro(null);
    setEditandoId(contato?.id ?? null);
    setForm(
      contato
        ? {
            nome: contato.nome,
            cargo: contato.cargo ?? '',
            celular: contato.celular ?? '',
            email: contato.email ?? '',
            recebe: contato.recebeTodos ? [TODOS] : contato.setores.map((s) => s.id),
          }
        : VAZIO
    );
    setAberto(true);
  }

  async function salvar(): Promise<void> {
    if (!form.nome.trim()) {
      setErro('Informe o nome do contato');
      return;
    }
    const recebeTodos = form.recebe.includes(TODOS) || form.recebe.length === 0;
    const payload = {
      nome: form.nome.trim(),
      cargo: form.cargo.trim() || null,
      celular: form.celular.trim() || null,
      email: form.email.trim() || null,
      recebeTodos,
      setorIds: recebeTodos ? [] : form.recebe,
    };
    setSalvando(true);
    setErro(null);
    try {
      const salvo = editandoId
        ? await api<ContatoCliente>(`/contatos/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<ContatoCliente>(`/clientes/${clienteId}/contatos`, { method: 'POST', body: JSON.stringify(payload) });
      const lista = editandoId ? contatos.map((c) => (c.id === salvo.id ? salvo : c)) : [...contatos, salvo];
      atualizar(lista.toSorted((a, b) => a.nome.localeCompare(b.nome)));
      setAberto(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar contato');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(contato: ContatoCliente): Promise<void> {
    setErro(null);
    try {
      await api(`/contatos/${contato.id}`, { method: 'DELETE' });
      atualizar(contatos.filter((c) => c.id !== contato.id));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao remover contato');
    }
  }

  function alterarRecebe(valor: string[]): void {
    // Escolher "Todos" limpa os departamentos; escolher um departamento tira o "Todos".
    const ultimo = valor.at(-1);
    if (ultimo === TODOS) setForm((f) => ({ ...f, recebe: [TODOS] }));
    else setForm((f) => ({ ...f, recebe: valor.filter((v) => v !== TODOS) }));
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">Contatos na empresa</Typography>
        <Button size="small" startIcon={<PlusIcon />} onClick={() => editar(null)}>
          Adicionar
        </Button>
      </Stack>
      {erro ? <Alert severity="error">{erro}</Alert> : null}

      {aberto ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField size="small" label="Nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} fullWidth autoFocus />
              <TextField size="small" label="Cargo" value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Celular (WhatsApp)"
                value={form.celular}
                onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
                fullWidth
              />
              <TextField size="small" label="E-mail" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} fullWidth />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel id="contato-recebe">Recebe documentos de</InputLabel>
              <Select
                labelId="contato-recebe"
                label="Recebe documentos de"
                multiple
                value={form.recebe}
                onChange={(e) => alterarRecebe(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(valor) =>
                  valor.includes(TODOS)
                    ? 'Todos os departamentos'
                    : valor.map((id) => setores.find((s) => s.id === id)?.nome ?? id).join(', ')
                }
              >
                <MenuItem value={TODOS}>
                  <Checkbox size="small" checked={form.recebe.includes(TODOS)} />
                  <ListItemText primary="Todos os departamentos" />
                </MenuItem>
                {setores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox size="small" checked={form.recebe.includes(s.id)} />
                    <ListItemText primary={s.nome} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button size="small" variant="contained" disabled={salvando} onClick={salvar}>
                {editandoId ? 'Salvar contato' : 'Adicionar contato'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {contatos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum contato. Sem contatos, as entregas não têm para quem gerar o protocolo.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Celular / E-mail</TableCell>
              <TableCell>Recebe</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {contatos.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Typography variant="body2">{c.nome}</Typography>
                  {c.cargo ? (
                    <Typography variant="caption" color="text.secondary">
                      {c.cargo}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {c.celular ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.email ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {c.recebeTodos ? (
                    <Chip size="small" label="Todos" color="primary" variant="outlined" />
                  ) : (
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {c.setores.map((s) => (
                        <Chip key={s.id} size="small" label={s.nome} variant="outlined" />
                      ))}
                    </Stack>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => editar(c)}>
                      <PencilSimpleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover">
                    <IconButton size="small" color="error" onClick={() => remover(c)}>
                      <TrashIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
