'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText';

import { api } from '@/lib/api';
import type { CampoPerfil, Lead } from '@/lib/leads';

interface Props {
  open: boolean;
  lead: Lead | null;
  campos: CampoPerfil[];
  disparoAutomatico: boolean;
  onClose: () => void;
  onSaved: (lead: Lead, enviado: boolean) => void;
}

interface Form {
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  observacoes: string;
  qualificacao: string;
  perfil: Record<string, string>;
}

const VAZIO: Form = { nome: '', telefone: '', email: '', origem: '', observacoes: '', qualificacao: '', perfil: {} };

interface Interpretado {
  nome: string | null;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  qualificacao: string | null;
  perfil: Record<string, string>;
  existente: { id: string; nome: string } | null;
}

export function LeadFormDialog({ open, lead, campos, disparoAutomatico, onClose, onSaved }: Props): React.JSX.Element {
  const [form, setForm] = React.useState<Form>(VAZIO);
  const [colado, setColado] = React.useState('');
  const [enviar, setEnviar] = React.useState(true);
  const [lido, setLido] = React.useState<string | null>(null);
  const [existente, setExistente] = React.useState<{ id: string; nome: string } | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setErro(null);
    setLido(null);
    setExistente(null);
    setColado('');
    setEnviar(true);
    setForm(
      lead
        ? {
            nome: lead.nome,
            telefone: lead.telefone,
            email: lead.email ?? '',
            origem: lead.origem ?? '',
            observacoes: lead.observacoes ?? '',
            qualificacao: lead.qualificacao ?? '',
            perfil: lead.perfil ?? {},
          }
        : VAZIO
    );
  }, [open, lead]);

  const set = (campo: keyof Omit<Form, 'perfil'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function lerMensagem(): Promise<void> {
    setErro(null);
    try {
      const r = await api<Interpretado>('/leads/interpretar', { method: 'POST', body: JSON.stringify({ texto: colado }) });
      setForm((f) => ({
        ...f,
        nome: r.nome ?? f.nome,
        telefone: r.telefone ?? f.telefone,
        email: r.email ?? f.email,
        origem: r.origem ?? f.origem,
        qualificacao: r.qualificacao ?? f.qualificacao,
        perfil: { ...f.perfil, ...r.perfil },
      }));
      const qtd = Object.keys(r.perfil).length + [r.nome, r.telefone].filter(Boolean).length;
      setLido(qtd ? `${qtd} campo(s) preenchido(s) a partir da mensagem. Confira antes de salvar.` : 'Não encontrei campos nessa mensagem.');
      setExistente(r.existente);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ler a mensagem');
    }
  }

  async function salvar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    const perfil = Object.fromEntries(Object.entries(form.perfil).filter(([, v]) => v.trim()));
    const corpo = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email || null,
      origem: form.origem || null,
      observacoes: form.observacoes || null,
      qualificacao: form.qualificacao || null,
      perfil,
    };
    try {
      const salvo = lead
        ? await api<Lead>(`/leads/${lead.id}`, { method: 'PUT', body: JSON.stringify(corpo) })
        : await api<Lead>('/leads', { method: 'POST', body: JSON.stringify({ ...corpo, enviar }) });
      onSaved(salvo, !lead && (enviar || disparoAutomatico));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  // Campos fora da lista conhecida (vindos de outro formulário) também aparecem.
  const extras = Object.keys(form.perfil).filter((k) => !campos.some((c) => c.chave === k));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{lead ? 'Editar lead' : 'Novo lead'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {lead ? null : (
            <Stack spacing={1}>
              <TextField
                label="Colar a mensagem do lead (opcional)"
                placeholder={'📩 Novo Lead Recebido (Meta Ads)\n👤 Nome: ...\n📞 Telefone: ...'}
                value={colado}
                onChange={(e) => setColado(e.target.value)}
                multiline
                minRows={3}
                maxRows={10}
                helperText="Cole a mensagem do anúncio como chegou no WhatsApp: nome, telefone e respostas são preenchidos sozinhos."
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button variant="outlined" startIcon={<ClipboardTextIcon />} onClick={() => void lerMensagem()} disabled={!colado.trim()}>
                  Ler mensagem
                </Button>
                {lido ? (
                  <Typography variant="body2" color="text.secondary">
                    {lido}
                  </Typography>
                ) : null}
              </Stack>
              {existente ? <Alert severity="warning">Já existe um lead com esse telefone: {existente.nome}.</Alert> : null}
              <Divider />
            </Stack>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Nome" value={form.nome} onChange={set('nome')} fullWidth required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="WhatsApp (com DDD)"
                value={form.telefone}
                onChange={set('telefone')}
                fullWidth
                required
                disabled={Boolean(lead?.conversaId)}
                helperText={lead?.conversaId ? 'O assistente já falou com este número.' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="E-mail" value={form.email} onChange={set('email')} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Origem" placeholder="Meta Ads, indicação..." value={form.origem} onChange={set('origem')} fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observações para o assistente"
                placeholder="O que já foi conversado no primeiro contato"
                value={form.observacoes}
                onChange={set('observacoes')}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
            <Grid size={12}>
              <TextField label="Qualificação" value={form.qualificacao} onChange={set('qualificacao')} fullWidth multiline />
            </Grid>
          </Grid>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Respostas do formulário</Typography>
            <Typography variant="caption" color="text.secondary">
              O que estiver preenchido o assistente não pergunta de novo. Os campos com * ele completa na conversa.
            </Typography>
            <Grid container spacing={2}>
              {[...campos.map((c) => ({ chave: c.chave, rotulo: c.obrigatorio ? `${c.rotulo} *` : c.rotulo })), ...extras.map((k) => ({ chave: k, rotulo: k }))].map(
                (c) => (
                  <Grid key={c.chave} size={{ xs: 12, md: 6 }}>
                    <TextField
                      label={c.rotulo}
                      value={form.perfil[c.chave] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, perfil: { ...f.perfil, [c.chave]: e.target.value } }))}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )
              )}
            </Grid>
          </Stack>

          {lead ? null : (
            <FormControlLabel
              control={<Checkbox checked={enviar || disparoAutomatico} disabled={disparoAutomatico} onChange={(e) => setEnviar(e.target.checked)} />}
              label={
                disparoAutomatico
                  ? 'Vai direto para a fila do assistente (envio automático ligado nas configurações)'
                  : 'Enviar ao assistente agora (entra na fila de envio espaçado)'
              }
            />
          )}
          {erro ? <Alert severity="error">{erro}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => void salvar()} disabled={salvando || !form.nome.trim() || !form.telefone.trim()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
