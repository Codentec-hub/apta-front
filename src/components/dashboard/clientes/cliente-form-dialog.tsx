'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import type { Cliente, ConjuntoObrigacoes, Setor, UsuarioResumo } from '@/types/domain';

import { ContatosEmpresa } from './contatos-empresa';

// Usados quando ainda não há regimes cadastrados (Obrigações → Regimes).
const REGIMES_PADRAO = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export interface ClienteFormDialogProps {
  open: boolean;
  cliente: Cliente | null;
  setores: Setor[];
  usuarios: UsuarioResumo[];
  onClose: () => void;
  onSaved: (cliente: Cliente) => void;
}

interface FormState {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regimeTributario: string;
  apelido: string;
  cidade: string;
  uf: string;
  grupoEmpresas: string;
  honorario: string;
}

const VAZIO: FormState = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  regimeTributario: '',
  apelido: '',
  cidade: 'Fortaleza',
  uf: 'CE',
  grupoEmpresas: '',
  honorario: '',
};

export function ClienteFormDialog({
  open,
  cliente,
  setores,
  usuarios,
  onClose,
  onSaved,
}: ClienteFormDialogProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [clienteAtual, setClienteAtual] = React.useState<Cliente | null>(cliente);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvandoResponsavelSetorId, setSalvandoResponsavelSetorId] = React.useState<string | null>(null);
  const [regimes, setRegimes] = React.useState<string[]>(REGIMES_PADRAO);

  // Regimes granulares do cadastro ("Simples Nacional - Comércio … - Com Funcionários").
  React.useEffect(() => {
    if (!open) return;
    api<ConjuntoObrigacoes[]>('/regimes')
      .then((lista) => {
        if (lista.length > 0) setRegimes(lista.map((r) => r.nome));
      })
      .catch(() => null);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setClienteAtual(cliente);
      setForm(
        cliente
          ? {
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia ?? '',
              cnpj: cliente.cnpj,
              regimeTributario: cliente.regimeTributario ?? '',
              apelido: cliente.apelido ?? '',
              cidade: cliente.cidade ?? '',
              uf: cliente.uf ?? '',
              grupoEmpresas: cliente.grupoEmpresas ?? '',
              honorario: cliente.honorario === null ? '' : String(cliente.honorario),
            }
          : VAZIO
      );
      setErro(null);
    }
  }, [open, cliente]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.razaoSocial.trim() || !form.cnpj.trim()) {
      setErro('Razão social e CNPJ são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    const payload = {
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia.trim() || null,
      cnpj: form.cnpj.trim(),
      regimeTributario: form.regimeTributario || null,
      apelido: form.apelido.trim() || null,
      cidade: form.cidade.trim() || null,
      uf: form.uf || null,
      grupoEmpresas: form.grupoEmpresas.trim() || null,
      honorario: form.honorario.trim() ? Number(form.honorario.replace(',', '.')) : null,
    };

    try {
      const salvo = clienteAtual
        ? await api<Cliente>(`/clientes/${clienteAtual.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(payload) });

      setClienteAtual(salvo);
      onSaved(salvo);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar cliente');
    } finally {
      setSalvando(false);
    }
  }

  async function alterarResponsavel(setorId: string, usuarioId: string): Promise<void> {
    if (!clienteAtual) {
      return;
    }
    setSalvandoResponsavelSetorId(setorId);
    setErro(null);
    try {
      await (usuarioId
        ? api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, {
            method: 'PUT',
            body: JSON.stringify({ usuarioId }),
          })
        : api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, { method: 'DELETE' }));
      const atualizado = await api<Cliente>(`/clientes/${clienteAtual.id}`);
      setClienteAtual(atualizado);
      onSaved(atualizado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar responsável');
    } finally {
      setSalvandoResponsavelSetorId(null);
    }
  }

  function responsavelDoSetor(setorId: string): string {
    return clienteAtual?.responsaveis.find((r) => r.setorId === setorId)?.usuarioId ?? '';
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {clienteAtual ? `Editar cliente [${String(clienteAtual.codigo).padStart(3, '0')}]` : 'Novo cliente'}
      </DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <TextField
              label="Razão social"
              value={form.razaoSocial}
              onChange={(event) => setForm((f) => ({ ...f, razaoSocial: event.target.value }))}
              required
              autoFocus
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nome fantasia"
                value={form.nomeFantasia}
                onChange={(event) => setForm((f) => ({ ...f, nomeFantasia: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Apelido"
                value={form.apelido}
                onChange={(event) => setForm((f) => ({ ...f, apelido: event.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="CNPJ / CPF / CAEPF"
                value={form.cnpj}
                onChange={(event) => setForm((f) => ({ ...f, cnpj: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Cidade"
                value={form.cidade}
                onChange={(event) => setForm((f) => ({ ...f, cidade: event.target.value }))}
                helperText="Define os feriados municipais"
                fullWidth
              />
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel id="uf-label">UF</InputLabel>
                <Select labelId="uf-label" label="UF" value={form.uf} onChange={(event) => setForm((f) => ({ ...f, uf: event.target.value }))}>
                  <MenuItem value="">
                    <em>—</em>
                  </MenuItem>
                  {UFS.map((uf) => (
                    <MenuItem key={uf} value={uf}>
                      {uf}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Grupo de empresas"
                value={form.grupoEmpresas}
                onChange={(event) => setForm((f) => ({ ...f, grupoEmpresas: event.target.value }))}
                placeholder="Geral"
                fullWidth
              />
              <TextField
                label="Honorário (R$)"
                value={form.honorario}
                onChange={(event) => setForm((f) => ({ ...f, honorario: event.target.value }))}
                inputMode="decimal"
                fullWidth
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="regime-label">Regime tributário</InputLabel>
              <Select
                labelId="regime-label"
                label="Regime tributário"
                value={form.regimeTributario}
                onChange={(event) => setForm((f) => ({ ...f, regimeTributario: event.target.value }))}
              >
                <MenuItem value="">
                  <em>Não definido</em>
                </MenuItem>
                {(form.regimeTributario && !regimes.includes(form.regimeTributario)
                  ? [...regimes, form.regimeTributario]
                  : regimes
                ).map((regime) => (
                  <MenuItem key={regime} value={regime}>
                    {regime}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {clienteAtual ? (
              <>
                <Divider />
                <ContatosEmpresa clienteId={clienteAtual.id} setores={setores} />
                <Divider />
                <Typography variant="subtitle2">Responsáveis por setor</Typography>
                <Stack spacing={2}>
                  {setores.map((setor) => (
                    <FormControl key={setor.id} fullWidth size="small">
                      <InputLabel id={`resp-${setor.id}`}>{setor.nome}</InputLabel>
                      <Select
                        labelId={`resp-${setor.id}`}
                        label={setor.nome}
                        value={responsavelDoSetor(setor.id)}
                        disabled={salvandoResponsavelSetorId === setor.id}
                        onChange={(event) => alterarResponsavel(setor.id, event.target.value)}
                      >
                        <MenuItem value="">
                          <em>Nenhum</em>
                        </MenuItem>
                        {usuarios.map((usuario) => (
                          <MenuItem key={usuario.id} value={usuario.id}>
                            {usuario.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Salve o cliente para poder cadastrar os contatos e atribuir os responsáveis por setor.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {clienteAtual ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
