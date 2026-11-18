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
import Link from '@mui/material/Link';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText';

import { paths } from '@/paths';
import { api, ErroApi } from '@/lib/api';
import { cnpjValido, formatarDocumento, somenteDigitos } from '@/lib/empresa';
import type { AvisoDuplicidade, CampoPerfil, Lead } from '@/lib/leads';

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
  cnpj: string;
  origem: string;
  observacoes: string;
  qualificacao: string;
  perfil: Record<string, string>;
}

const VAZIO: Form = { nome: '', telefone: '', email: '', cnpj: '', origem: '', observacoes: '', qualificacao: '', perfil: {} };

interface Interpretado {
  nome: string | null;
  telefone: string | null;
  email: string | null;
  cnpj: string | null;
  origem: string | null;
  qualificacao: string | null;
  perfil: Record<string, string>;
  avisos: AvisoDuplicidade[];
}

/** Link para o registro que causou o aviso (outro lead, cliente ou conversa). */
function linkDoAviso(a: AvisoDuplicidade): { href: string; rotulo: string } | null {
  if (a.leadId) return { href: `${paths.dashboard.leads}?lead=${a.leadId}`, rotulo: 'Abrir lead' };
  if (a.clienteId) return { href: `${paths.dashboard.clientes}/${a.clienteId}`, rotulo: 'Abrir cliente' };
  if (a.conversaId) return { href: `${paths.dashboard.atendimento}?conversa=${a.conversaId}`, rotulo: 'Abrir conversa' };
  return null;
}

export function LeadFormDialog({ open, lead, campos, disparoAutomatico, onClose, onSaved }: Props): React.JSX.Element {
  const [form, setForm] = React.useState<Form>(VAZIO);
  const [colado, setColado] = React.useState('');
  const [enviar, setEnviar] = React.useState(true);
  const [lido, setLido] = React.useState<string | null>(null);
  const [avisos, setAvisos] = React.useState<AvisoDuplicidade[]>([]);
  const [ciente, setCiente] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setErro(null);
    setLido(null);
    setAvisos([]);
    setCiente(false);
    setColado('');
    setEnviar(true);
    setForm(
      lead
        ? {
            nome: lead.nome,
            telefone: lead.telefone,
            email: lead.email ?? '',
            cnpj: lead.cnpj ? formatarDocumento(lead.cnpj) : '',
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

  // Ao sair do telefone, CNPJ ou e-mail: já mostra se é de outro lead, de um
  // cliente ou de uma conversa em andamento.
  async function verificar(dados: Pick<Form, 'telefone' | 'cnpj' | 'email'>): Promise<void> {
    const q = new URLSearchParams();
    if (somenteDigitos(dados.telefone).length >= 10 && dados.telefone !== lead?.telefone) q.set('telefone', dados.telefone);
    if (cnpjValido(dados.cnpj) && somenteDigitos(dados.cnpj) !== lead?.cnpj) q.set('cnpj', dados.cnpj);
    if (dados.email.includes('@') && dados.email.toLowerCase() !== lead?.email?.toLowerCase()) q.set('email', dados.email.trim());
    if (lead) q.set('excetoId', lead.id);
    if (![...q.keys()].some((k) => k !== 'excetoId')) {
      setAvisos([]);
      return;
    }
    try {
      const r = await api<{ avisos: AvisoDuplicidade[] }>(`/leads/verificar?${q.toString()}`);
      setAvisos(r.avisos);
      setCiente(false);
    } catch {
      // A conferência é ajuda; o servidor confere de novo ao salvar.
    }
  }
  const aoSair = () => void verificar(form);

  async function lerMensagem(): Promise<void> {
    setErro(null);
    try {
      const r = await api<Interpretado>('/leads/interpretar', { method: 'POST', body: JSON.stringify({ texto: colado }) });
      setForm((f) => ({
        ...f,
        nome: r.nome ?? f.nome,
        telefone: r.telefone ?? f.telefone,
        email: r.email ?? f.email,
        cnpj: r.cnpj ? formatarDocumento(r.cnpj) : f.cnpj,
        origem: r.origem ?? f.origem,
        qualificacao: r.qualificacao ?? f.qualificacao,
        perfil: { ...f.perfil, ...r.perfil },
      }));
      const qtd = Object.keys(r.perfil).length + [r.nome, r.telefone].filter(Boolean).length;
      setLido(qtd ? `${qtd} campo(s) preenchido(s) a partir da mensagem. Confira antes de salvar.` : 'Não encontrei campos nessa mensagem.');
      setAvisos(r.avisos);
      setCiente(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ler a mensagem');
    }
  }

  async function salvar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    const perfil = Object.fromEntries(Object.entries(form.perfil).filter(([, v]) => v.trim()));
    if (form.cnpj.trim() && !cnpjValido(form.cnpj)) {
      setErro('CNPJ inválido (confira os números)');
      setSalvando(false);
      return;
    }
    const corpo = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email || null,
      cnpj: form.cnpj.trim() ? somenteDigitos(form.cnpj) : null,
      confirmarAvisos: ciente,
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
      const corpo = error instanceof ErroApi ? (error.corpo as { avisos?: AvisoDuplicidade[] } | null) : null;
      if (corpo?.avisos?.length) {
        setAvisos(corpo.avisos);
        setCiente(false);
      }
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  const bloqueado = avisos.some((a) => a.bloqueia);
  const precisaCiencia = avisos.length > 0 && !bloqueado;

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
                onBlur={aoSair}
                fullWidth
                required
                disabled={Boolean(lead?.conversaId)}
                helperText={lead?.conversaId ? 'O assistente já falou com este número.' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="E-mail" value={form.email} onChange={set('email')} onBlur={aoSair} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="CNPJ (se tiver)"
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: formatarDocumento(e.target.value) }))}
                onBlur={aoSair}
                error={Boolean(form.cnpj.trim()) && somenteDigitos(form.cnpj).length >= 14 && !cnpjValido(form.cnpj)}
                helperText="Usado para saber se a empresa já é cliente ou já está com outro lead."
                fullWidth
              />
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
          {avisos.length > 0 ? (
            <Stack spacing={1}>
              {avisos.map((a) => {
                const link = linkDoAviso(a);
                return (
                  <Alert key={`${a.tipo}:${a.mensagem}`} severity={a.bloqueia ? 'error' : 'warning'}>
                    {a.mensagem}{' '}
                    {link ? (
                      <Link href={link.href} target="_blank" rel="noopener" underline="always" color="inherit">
                        {link.rotulo}
                      </Link>
                    ) : null}
                  </Alert>
                );
              })}
              {precisaCiencia ? (
                <FormControlLabel
                  control={<Checkbox checked={ciente} onChange={(e) => setCiente(e.target.checked)} />}
                  label="Conferi os avisos acima e quero salvar mesmo assim"
                />
              ) : null}
            </Stack>
          ) : null}
          {erro && !(avisos.length > 0 && erro.startsWith('Confira os avisos')) ? <Alert severity="error">{erro}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => void salvar()} disabled={salvando || !form.nome.trim() || !form.telefone.trim() || bloqueado || (precisaCiencia && !ciente)}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
