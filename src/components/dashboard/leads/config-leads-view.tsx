'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import dayjs from 'dayjs';
import RouterLink from 'next/link';

import { paths } from '@/paths';
import { api } from '@/lib/api';
import { DIAS_CURTOS, type SituacaoFila } from '@/lib/leads';
import { useUser } from '@/hooks/use-user';

interface Config {
  disparoAtivo: boolean;
  disparoAutomatico: boolean;
  intervaloMinMin: number;
  intervaloMaxMin: number;
  tetoDiario: number;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
  lembreteHoras: number;
  prazoPreReservaHoras: number;
  antecedenciaMinHoras: number;
  diasAgendaAberta: number;
  nomeIndicador: string;
  mensagensIniciais: string[];
  mensagemLembrete: string | null;
  enviarConfirmacao: boolean;
  mensagemConfirmacao: string | null;
  formatoAtendimento: string;
  notificarIds: string[];
  agenteId: string | null;
}

interface Resposta extends Config {
  agente: { id: string; nome: string; ativo: boolean };
  fila: SituacaoFila;
  padroes: { mensagensIniciais: string[]; mensagemLembrete: string; mensagemConfirmacao: string };
}

interface Pessoa {
  id: string;
  nome: string;
  ativo: boolean;
}

const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export function ConfigLeadsView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = user?.perfil === 'ADMIN' || user?.perfil === 'GESTOR';
  const [dados, setDados] = React.useState<Resposta | null>(null);
  const [form, setForm] = React.useState<Config | null>(null);
  const [agentes, setAgentes] = React.useState<Pessoa[]>([]);
  const [usuarios, setUsuarios] = React.useState<Pessoa[]>([]);
  const [salvando, setSalvando] = React.useState(false);
  const [aviso, setAviso] = React.useState<{ texto: string; erro?: boolean } | null>(null);

  const carregar = React.useCallback(() => {
    api<Resposta>('/configuracoes/leads')
      .then((r) => {
        setDados(r);
        const { agente: _a, fila: _f, padroes: _p, ...config } = r;
        setForm({ ...config, agenteId: config.agenteId ?? r.agente.id });
      })
      .catch((error: unknown) => setAviso({ texto: error instanceof Error ? error.message : 'Erro ao carregar', erro: true }));
  }, []);

  React.useEffect(() => {
    carregar();
    api<Pessoa[]>('/agentes')
      .then(setAgentes)
      .catch(() => setAgentes([]));
    api<Pessoa[]>('/usuarios')
      .then((l) => setUsuarios(l.filter((u) => u.ativo)))
      .catch(() => setUsuarios([]));
  }, [carregar]);

  if (!form || !dados) {
    return <Typography color="text.secondary">Carregando…</Typography>;
  }

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const num = (k: keyof Config, rotulo: string, ajuda?: string, md = 3) => (
    <Grid size={{ xs: 12, sm: 6, md }}>
      <TextField
        type="number"
        label={rotulo}
        value={form[k] as number}
        onChange={(e) => set(k, Number(e.target.value) as never)}
        disabled={!podeEditar}
        helperText={ajuda}
        fullWidth
        size="small"
      />
    </Grid>
  );

  async function salvar(): Promise<void> {
    if (!form) return;
    setSalvando(true);
    try {
      await api('/configuracoes/leads', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          mensagensIniciais: form.mensagensIniciais.filter((m) => m.trim()),
          mensagemLembrete: form.mensagemLembrete?.trim() || null,
          mensagemConfirmacao: form.mensagemConfirmacao?.trim() || null,
        }),
      });
      setAviso({ texto: 'Configuração salva.' });
      carregar();
    } catch (error) {
      setAviso({ texto: error instanceof Error ? error.message : 'Erro ao salvar', erro: true });
    } finally {
      setSalvando(false);
    }
  }

  const mensagens = form.mensagensIniciais;
  const fila = dados.fila;

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Stack spacing={1}>
          <Typography variant="h4">Leads e agendamento</Typography>
          <Typography color="text.secondary" variant="body2">
            Como o assistente chama os leads no WhatsApp e reserva os horários. Os envios são espaçados para proteger o número.
          </Typography>
        </Stack>
        {podeEditar ? (
          <Button variant="contained" onClick={() => void salvar()} disabled={salvando}>
            Salvar
          </Button>
        ) : null}
      </Stack>

      <Alert severity={fila.pausa ? 'warning' : 'success'} variant="outlined">
        {fila.pausa ? `Fila parada: ${fila.pausa}. ` : 'Fila funcionando. '}
        {fila.naFila} lead(s) aguardando · {fila.enviadosHoje} de {fila.tetoDiario} envios hoje
        {!fila.pausa && fila.proximoEnvioEm && fila.naFila ? ` · próximo às ${dayjs(fila.proximoEnvioEm).format('HH:mm')}` : ''}
      </Alert>

      <Card variant="outlined">
        <CardHeader title="Assistente" subheader="O agente de IA que conversa com os leads." />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField select label="Agente" value={form.agenteId ?? ''} onChange={(e) => set('agenteId', e.target.value)} disabled={!podeEditar} fullWidth size="small">
                {agentes.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nome}
                    {a.ativo ? '' : ' (inativo)'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Quem passa o lead"
                value={form.nomeIndicador}
                onChange={(e) => set('nomeIndicador', e.target.value)}
                helperText='Aparece como {indicador} nas mensagens ("o Rafael me passou...")'
                disabled={!podeEditar}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Como é o atendimento"
                value={form.formatoAtendimento}
                onChange={(e) => set('formatoAtendimento', e.target.value)}
                helperText='Ex.: "por videochamada", "no escritório"'
                disabled={!podeEditar}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
          {dados.agente.ativo ? null : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              O agente {dados.agente.nome} está inativo: as conversas voltam para a equipe.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Tom de voz, perguntas e critérios de perfil ficam nas instruções do agente, em{' '}
            <RouterLink href={paths.dashboard.agentes}>Agentes de IA</RouterLink>. As regras de segurança (nunca dizer que está confirmado,
            sem links e sem preços) são fixas no sistema.
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Fila de envio" subheader="Um lead por vez, com intervalo aleatório, teto diário e só no horário comercial." />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <FormControlLabel
                control={<Switch checked={form.disparoAtivo} onChange={(e) => set('disparoAtivo', e.target.checked)} disabled={!podeEditar} />}
                label="Envios ligados"
              />
              <FormControlLabel
                control={<Switch checked={form.disparoAutomatico} onChange={(e) => set('disparoAutomatico', e.target.checked)} disabled={!podeEditar} />}
                label='Lead cadastrado já entra na fila (sem clicar em "Enviar ao assistente")'
              />
            </Stack>
            <Grid container spacing={2}>
              {num('intervaloMinMin', 'Intervalo mínimo (min)')}
              {num('intervaloMaxMin', 'Intervalo máximo (min)')}
              {num('tetoDiario', 'Teto de envios por dia', 'Comece baixo (20–30) e suba aos poucos')}
              {num('lembreteHoras', 'Lembrete depois de (h)', 'Um lembrete só; depois, "sem resposta"')}
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField type="time" label="Envia a partir de" value={form.horaInicio} onChange={(e) => set('horaInicio', e.target.value)} disabled={!podeEditar} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField type="time" label="Até" value={form.horaFim} onChange={(e) => set('horaFim', e.target.value)} disabled={!podeEditar} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, alignItems: 'center', height: '100%' }}>
                  {ORDEM.map((d) => {
                    const on = form.diasSemana.includes(d);
                    return (
                      <Chip
                        key={d}
                        label={DIAS_CURTOS[d]}
                        color={on ? 'primary' : 'default'}
                        variant={on ? 'filled' : 'outlined'}
                        onClick={podeEditar ? () => set('diasSemana', on ? form.diasSemana.filter((x) => x !== d) : [...form.diasSemana, d]) : undefined}
                      />
                    );
                  })}
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Agenda" subheader="Prazos da pré-reserva e quanto da agenda o assistente pode oferecer." />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {num('prazoPreReservaHoras', 'Prazo para confirmar (h)', 'Depois disso a pré-reserva expira')}
            {num('antecedenciaMinHoras', 'Antecedência mínima (h)', 'Não oferece horários antes disso')}
            {num('diasAgendaAberta', 'Agenda aberta (dias)', 'Até quantos dias à frente oferece')}
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                A grade de horários e os bloqueios ficam em <RouterLink href={`${paths.dashboard.agenda}?aba=horarios`}>Agenda → Horários</RouterLink>.
              </Typography>
            </Grid>
            <Grid size={12}>
              <Autocomplete
                multiple
                options={usuarios}
                getOptionLabel={(u) => u.nome}
                value={usuarios.filter((u) => form.notificarIds.includes(u.id))}
                onChange={(_e, v) => set('notificarIds', v.map((u) => u.id))}
                disabled={!podeEditar}
                renderInput={(p) => (
                  <TextField {...p} size="small" label="Quem é avisado das pré-reservas" helperText="Vazio = gestores e administradores. Quem cadastrou o lead também é avisado." />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title="Mensagens"
          subheader="Use {primeiroNome}, {nome}, {indicador}, {escritorio}; na confirmação também {data} e {formato}. Sem links na primeira mensagem."
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Primeira mensagem (o sistema sorteia uma das variações)</Typography>
            {mensagens.length === 0 ? (
              <Alert severity="info">
                Usando as {dados.padroes.mensagensIniciais.length} variações padrão. Clique em &quot;Personalizar&quot; para editar.
              </Alert>
            ) : null}
            {mensagens.map((m, i) => (
              <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <TextField
                  value={m}
                  onChange={(e) => set('mensagensIniciais', mensagens.map((x, j) => (j === i ? e.target.value : x)))}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  label={`Variação ${i + 1}`}
                  disabled={!podeEditar}
                />
                {podeEditar ? (
                  <IconButton aria-label="Remover variação" onClick={() => set('mensagensIniciais', mensagens.filter((_x, j) => j !== i))}>
                    <TrashIcon />
                  </IconButton>
                ) : null}
              </Stack>
            ))}
            {podeEditar ? (
              <Stack direction="row" spacing={1}>
                {mensagens.length === 0 ? (
                  <Button variant="outlined" onClick={() => set('mensagensIniciais', [...dados.padroes.mensagensIniciais])}>
                    Personalizar
                  </Button>
                ) : (
                  <Button startIcon={<PlusIcon />} onClick={() => set('mensagensIniciais', [...mensagens, ''])} disabled={mensagens.length >= 10}>
                    Variação
                  </Button>
                )}
              </Stack>
            ) : null}
            <Divider />
            <TextField
              label="Lembrete (para quem não respondeu)"
              value={form.mensagemLembrete ?? ''}
              placeholder={dados.padroes.mensagemLembrete}
              onChange={(e) => set('mensagemLembrete', e.target.value)}
              multiline
              minRows={2}
              disabled={!podeEditar}
              helperText="Vazio = texto padrão (o que aparece em cinza)"
            />
            <FormControlLabel
              control={<Switch checked={form.enviarConfirmacao} onChange={(e) => set('enviarConfirmacao', e.target.checked)} disabled={!podeEditar} />}
              label="Ao confirmar, já marcar para enviar a mensagem de confirmação ao lead"
            />
            <TextField
              label="Confirmação ao lead"
              value={form.mensagemConfirmacao ?? ''}
              placeholder={dados.padroes.mensagemConfirmacao}
              onChange={(e) => set('mensagemConfirmacao', e.target.value)}
              multiline
              minRows={2}
              disabled={!podeEditar}
              helperText="Vazio = texto padrão (o que aparece em cinza)"
            />
          </Stack>
        </CardContent>
      </Card>

      <Snackbar open={Boolean(aviso)} autoHideDuration={5000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity={aviso?.erro ? 'error' : 'success'} sx={{ width: '100%' }}>
          {aviso?.texto}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
