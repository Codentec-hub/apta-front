'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ClockCounterClockwise';
import { CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr/FloppyDisk';
import { NotePencilIcon } from '@phosphor-icons/react/dist/ssr/NotePencil';
import { PlusCircleIcon } from '@phosphor-icons/react/dist/ssr/PlusCircle';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import {
  AJUSTE_LABEL,
  formatarCompetencia,
  MESES_LONGOS,
  OPCOES_COMPETENCIA,
  OPCOES_DATA_ENTREGA,
} from '@/lib/obrigacao-status';
import type { AjustePrazo, Cliente, Setor, TipoDias, TipoObrigacao } from '@/types/domain';

export interface TipoObrigacaoFormDialogProps {
  open: boolean;
  tipo: TipoObrigacao | null;
  setores: Setor[];
  clientes: Cliente[];
  onClose: () => void;
  onSaved: (tipo: TipoObrigacao) => void;
  onAviso: (mensagem: string) => void;
}

interface FormState {
  nome: string;
  mininome: string;
  setorId: string;
  tempoPrevistoMinutos: string;
  entregasPorMes: number[];
  diasAntes: number;
  tipoDiasAntes: TipoDias;
  ajustePrazo: AjustePrazo;
  sabadoUtil: boolean;
  competenciaReferente: number;
  geraMulta: boolean;
  ativo: boolean;
  comentarioPadrao: string;
}

const VAZIO: FormState = {
  nome: '',
  mininome: '',
  setorId: '',
  tempoPrevistoMinutos: '',
  entregasPorMes: Array.from({ length: 12 }, () => 0),
  diasAntes: 5,
  tipoDiasAntes: 'CORRIDOS',
  ajustePrazo: 'ANTECIPAR',
  sabadoUtil: false,
  competenciaReferente: -1,
  geraMulta: false,
  ativo: true,
  comentarioPadrao: '',
};

// Opções do "Lembrar responsável quantos dias antes" (iguais às do Acessórias).
const OPCOES_DIAS_ANTES = [
  ...Array.from({ length: 46 }, (_, i) => i),
  50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180,
];

interface Simulacao {
  competencia: string;
  prazo: string;
  prazoTecnico: string;
}

interface EmpresaDaObrigacao {
  id: string;
  ativa: boolean;
  cliente: { id: string; razaoSocial: string; cnpj: string; ativo: boolean };
}

function formDoTipo(tipo: TipoObrigacao): FormState {
  return {
    nome: tipo.nome,
    mininome: tipo.mininome ?? '',
    setorId: tipo.setorId,
    tempoPrevistoMinutos: tipo.tempoPrevistoMinutos?.toString() ?? '',
    entregasPorMes: tipo.entregasPorMes.length === 12 ? tipo.entregasPorMes : VAZIO.entregasPorMes,
    diasAntes: tipo.diasAntes,
    tipoDiasAntes: tipo.tipoDiasAntes,
    ajustePrazo: tipo.ajustePrazo,
    sabadoUtil: tipo.sabadoUtil,
    competenciaReferente: tipo.competenciaReferente,
    geraMulta: tipo.geraMulta,
    ativo: tipo.ativo,
    comentarioPadrao: tipo.comentarioPadrao ?? '',
  };
}

// "Cadastro de obrigação" do Acessórias: mesmos campos, na mesma ordem,
// com os botões Retro / Avulsa / Salvar / Nova / Voltar e a lista de
// empresas que precisam entregar a obrigação.
export function TipoObrigacaoFormDialog({
  open,
  tipo,
  setores,
  clientes,
  onClose,
  onSaved,
  onAviso,
}: TipoObrigacaoFormDialogProps): React.JSX.Element {
  const [atual, setAtual] = React.useState<TipoObrigacao | null>(null);
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [simulacao, setSimulacao] = React.useState<Simulacao[]>([]);
  const [empresas, setEmpresas] = React.useState<EmpresaDaObrigacao[] | null>(null);
  const [listarEmpresas, setListarEmpresas] = React.useState(false);
  const [adicionando, setAdicionando] = React.useState<Cliente[]>([]);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [subDialog, setSubDialog] = React.useState<'retro' | 'avulsa' | 'replicar' | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setAtual(tipo);
    setForm(tipo ? formDoTipo(tipo) : VAZIO);
    setErro(null);
    setListarEmpresas(false);
    setAdicionando([]);
  }, [open, tipo]);

  const carregarEmpresas = React.useCallback(() => {
    if (!atual) {
      setEmpresas(null);
      return;
    }
    api<EmpresaDaObrigacao[]>(`/tipos-obrigacao/${atual.id}/empresas`)
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, [atual]);

  React.useEffect(() => {
    if (open) carregarEmpresas();
  }, [open, carregarEmpresas]);

  const regra = {
    entregasPorMes: form.entregasPorMes,
    competenciaReferente: form.competenciaReferente,
    diasAntes: form.diasAntes,
    tipoDiasAntes: form.tipoDiasAntes,
    ajustePrazo: form.ajustePrazo,
    sabadoUtil: form.sabadoUtil,
  };
  const chaveRegra = JSON.stringify(regra);
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      api<Simulacao[]>('/tipos-obrigacao/simular-prazos', { method: 'POST', body: chaveRegra })
        .then(setSimulacao)
        .catch(() => setSimulacao([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, chaveRegra]);

  function campo<K extends keyof FormState>(chave: K, valor: FormState[K]): void {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  function definirMes(indice: number, codigo: number): void {
    setForm((f) => ({ ...f, entregasPorMes: f.entregasPorMes.map((c, i) => (i === indice ? codigo : c)) }));
  }

  function copiarParaDemais(indice: number): void {
    setForm((f) => ({ ...f, entregasPorMes: f.entregasPorMes.map((c, i) => (i > indice ? f.entregasPorMes[indice] : c)) }));
  }

  async function salvar(): Promise<void> {
    if (!form.nome.trim() || !form.setorId) {
      setErro('Nome da obrigação e departamento são obrigatórios');
      return;
    }
    setSalvando(true);
    setErro(null);
    const payload = {
      ...regra,
      nome: form.nome.trim(),
      mininome: form.mininome.trim() || null,
      setorId: form.setorId,
      tempoPrevistoMinutos: form.tempoPrevistoMinutos ? Number(form.tempoPrevistoMinutos) : null,
      geraMulta: form.geraMulta,
      ativo: form.ativo,
      comentarioPadrao: form.comentarioPadrao.trim() || null,
    };
    try {
      const salvo = atual
        ? await api<TipoObrigacao>(`/tipos-obrigacao/${atual.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<TipoObrigacao>('/tipos-obrigacao', { method: 'POST', body: JSON.stringify(payload) });
      onSaved(salvo);
      setAtual(salvo);
      onAviso(atual ? 'Obrigação salva — pendências futuras recalculadas' : 'Obrigação cadastrada');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar obrigação');
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarEmpresas(): Promise<void> {
    if (!atual || adicionando.length === 0) return;
    try {
      await api(`/tipos-obrigacao/${atual.id}/empresas`, {
        method: 'POST',
        body: JSON.stringify({ clienteIds: adicionando.map((c) => c.id) }),
      });
      onAviso(`${adicionando.length} empresa(s) adicionada(s) — pendências geradas`);
      setAdicionando([]);
      setListarEmpresas(true);
      carregarEmpresas();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao adicionar empresas');
    }
  }

  const empresasAtivas = (empresas ?? []).filter((e) => e.ativa);
  const idsComObrigacao = new Set(empresasAtivas.map((e) => e.cliente.id));
  const anual = Math.abs(form.competenciaReferente) === 12;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{atual ? 'Cadastro de obrigação' : 'Nova obrigação'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '3fr 1.5fr 3fr 1.2fr' } }}>
            <TextField
              label="Nome da obrigação"
              value={form.nome}
              onChange={(e) => campo('nome', e.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: atual ? (
                    <Tooltip title="Replicar obrigação">
                      <IconButton size="small" onClick={() => setSubDialog('replicar')}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  ) : undefined,
                },
              }}
            />
            <TextField
              label="Mininome"
              value={form.mininome}
              onChange={(e) => campo('mininome', e.target.value.toUpperCase())}
              helperText="Nome curto (ex.: ADTSAL)"
              slotProps={{ htmlInput: { maxLength: 12 } }}
            />
            <FormControl required>
              <InputLabel id="tipo-depto">Departamento e Responsável</InputLabel>
              <Select
                labelId="tipo-depto"
                label="Departamento e Responsável"
                value={form.setorId}
                onChange={(e) => campo('setorId', e.target.value)}
              >
                {setores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nome} - {s.responsavel?.nome ?? 'sem responsável'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Tempo previsto (min)"
              type="number"
              value={form.tempoPrevistoMinutos}
              onChange={(e) => campo('tempoPrevistoMinutos', e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' } }}>
            {MESES_LONGOS.map((nomeMes, i) => (
              <Stack key={nomeMes} spacing={0.25}>
                <FormControl size="small">
                  <InputLabel id={`mes-${i}`}>Entrega {nomeMes}</InputLabel>
                  <Select
                    labelId={`mes-${i}`}
                    label={`Entrega ${nomeMes}`}
                    value={form.entregasPorMes[i]}
                    onChange={(e) => definirMes(i, Number(e.target.value))}
                    MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}
                  >
                    {OPCOES_DATA_ENTREGA.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {i < 11 ? (
                  <Link component="button" type="button" variant="caption" onClick={() => copiarParaDemais(i)} sx={{ alignSelf: 'flex-start' }}>
                    Copiar para demais meses
                  </Link>
                ) : null}
              </Stack>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 2fr 1fr' } }}>
            <FormControl>
              <InputLabel id="tipo-dias-antes">Lembrar responsável quantos dias antes?</InputLabel>
              <Select
                labelId="tipo-dias-antes"
                label="Lembrar responsável quantos dias antes?"
                value={form.diasAntes}
                onChange={(e) => campo('diasAntes', Number(e.target.value))}
                MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}
              >
                {OPCOES_DIAS_ANTES.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} dias antes
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="tipo-tipo-dias">Tipo do dias antes</InputLabel>
              <Select
                labelId="tipo-tipo-dias"
                label="Tipo do dias antes"
                value={form.tipoDiasAntes}
                onChange={(e) => campo('tipoDiasAntes', e.target.value as TipoDias)}
              >
                <MenuItem value="UTEIS">Dias úteis</MenuItem>
                <MenuItem value="CORRIDOS">Dias corridos</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="tipo-ajuste">Prazos fixos em dias não-úteis</InputLabel>
              <Select
                labelId="tipo-ajuste"
                label="Prazos fixos em dias não-úteis"
                value={form.ajustePrazo}
                onChange={(e) => campo('ajustePrazo', e.target.value as AjustePrazo)}
              >
                {(Object.keys(AJUSTE_LABEL) as AjustePrazo[]).map((a) => (
                  <MenuItem key={a} value={a}>
                    {AJUSTE_LABEL[a]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="tipo-sabado">Sábado é útil?</InputLabel>
              <Select
                labelId="tipo-sabado"
                label="Sábado é útil?"
                value={form.sabadoUtil ? 'S' : 'N'}
                onChange={(e) => campo('sabadoUtil', e.target.value === 'S')}
              >
                <MenuItem value="N">Não</MenuItem>
                <MenuItem value="S">Sim</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' } }}>
            <FormControl>
              <InputLabel id="tipo-comp">Competências referentes a</InputLabel>
              <Select
                labelId="tipo-comp"
                label="Competências referentes a"
                value={form.competenciaReferente}
                onChange={(e) => campo('competenciaReferente', Number(e.target.value))}
              >
                {OPCOES_COMPETENCIA.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="tipo-multa">Passível de multa?</InputLabel>
              <Select
                labelId="tipo-multa"
                label="Passível de multa?"
                value={form.geraMulta ? 'S' : 'N'}
                onChange={(e) => campo('geraMulta', e.target.value === 'S')}
              >
                <MenuItem value="N">Não</MenuItem>
                <MenuItem value="S">Sim</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="tipo-ativa">Ativa?</InputLabel>
              <Select
                labelId="tipo-ativa"
                label="Ativa?"
                value={form.ativo ? 'S' : 'N'}
                onChange={(e) => campo('ativo', e.target.value === 'S')}
              >
                <MenuItem value="S">Sim</MenuItem>
                <MenuItem value="N">Não</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Comentário padrão"
            value={form.comentarioPadrao}
            onChange={(e) => campo('comentarioPadrao', e.target.value)}
            helperText="Sugerido no comentário ao registrar a entrega"
            multiline
            minRows={2}
          />

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'var(--mui-palette-background-level1)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Próximas entregas geradas por esta regra
            </Typography>
            {simulacao.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                Nenhum mês com entrega (todos “Não tem”) — a obrigação só entra como avulsa.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 0.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                {simulacao.map((s) => (
                  <Typography key={s.prazo} variant="body2">
                    Comp. {formatarCompetencia(s.competencia, anual)} → técnico{' '}
                    <strong>{dayjs(s.prazoTecnico).format('ddd DD/MM/YY')}</strong> · legal{' '}
                    <strong>{dayjs(s.prazo).format('ddd DD/MM/YY')}</strong>
                  </Typography>
                ))}
              </Box>
            )}
            <Typography color="text.secondary" variant="caption">
              Considera fins de semana e feriados nacionais. Feriados locais: alteração de prazos em massa na Lista de
              Entregas.
            </Typography>
          </Paper>

          {atual ? (
            <Stack spacing={1}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2">
                  Empresas que precisam entregar essa obrigação [{empresasAtivas.length} empresas]{' '}
                  <Link component="button" type="button" onClick={() => setListarEmpresas((v) => !v)}>
                    ({listarEmpresas ? 'Clique para ocultar' : 'Clique para listar'})
                  </Link>
                </Typography>
              </Stack>
              {listarEmpresas ? (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {empresasAtivas.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      Nenhuma empresa.
                    </Typography>
                  ) : (
                    empresasAtivas.map((e) => <Chip key={e.id} size="small" variant="outlined" label={e.cliente.razaoSocial} />)
                  )}
                </Stack>
              ) : null}
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={clientes.filter((c) => c.ativo && !idsComObrigacao.has(c.id))}
                  value={adicionando}
                  getOptionLabel={(c) => c.razaoSocial}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_e, v) => setAdicionando(v)}
                  renderInput={(params) => <TextField {...params} label="Adicionar empresa a essa obrigação" />}
                  sx={{ flex: 1 }}
                />
                <Button startIcon={<PlusCircleIcon />} disabled={adicionando.length === 0} onClick={adicionarEmpresas}>
                  Adicionar
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Tooltip title={atual ? 'Gerar pendências retroativas' : 'Salve a obrigação primeiro'}>
          <span>
            <Button color="secondary" variant="outlined" startIcon={<ClockCounterClockwiseIcon />} disabled={!atual} onClick={() => setSubDialog('retro')}>
              Retro
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={atual ? 'Gerar demandas avulsas' : 'Salve a obrigação primeiro'}>
          <span>
            <Button variant="outlined" startIcon={<NotePencilIcon />} disabled={!atual} onClick={() => setSubDialog('avulsa')}>
              Avulsa
            </Button>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" color="success" startIcon={<FloppyDiskIcon />} disabled={salvando} onClick={salvar}>
          Salvar
        </Button>
        <Button
          variant="contained"
          startIcon={<PlusCircleIcon />}
          onClick={() => {
            setAtual(null);
            setForm(VAZIO);
            setErro(null);
          }}
        >
          Nova
        </Button>
        <Button color="warning" variant="contained" onClick={onClose}>
          Voltar
        </Button>
      </DialogActions>

      {atual ? (
        <>
          <RetroDialog open={subDialog === 'retro'} tipo={atual} onClose={() => setSubDialog(null)} onAviso={onAviso} />
          <AvulsaDialog
            open={subDialog === 'avulsa'}
            tipo={atual}
            empresas={empresasAtivas.map((e) => e.cliente)}
            clientes={clientes}
            onClose={() => setSubDialog(null)}
            onAviso={onAviso}
          />
          <ReplicarDialog
            open={subDialog === 'replicar'}
            tipo={atual}
            onClose={() => setSubDialog(null)}
            onReplicada={(copia) => {
              onSaved(copia);
              setAtual(copia);
              setForm(formDoTipo(copia));
              onAviso(`Obrigação replicada como “${copia.nome}”`);
            }}
          />
        </>
      ) : null}
    </Dialog>
  );
}

interface SubDialogProps {
  open: boolean;
  tipo: TipoObrigacao;
  onClose: () => void;
  onAviso: (mensagem: string) => void;
}

function RetroDialog({ open, tipo, onClose, onAviso }: SubDialogProps): React.JSX.Element {
  const [desde, setDesde] = React.useState<Dayjs | null>(dayjs().subtract(3, 'month').startOf('month'));
  const [erro, setErro] = React.useState<string | null>(null);

  async function gerar(): Promise<void> {
    if (!desde) return;
    try {
      const r = await api<{ criadas: number }>(`/tipos-obrigacao/${tipo.id}/retro`, {
        method: 'POST',
        body: JSON.stringify({ desde: desde.format('YYYY-MM') }),
      });
      onAviso(`${r.criadas} pendência(s) retroativa(s) gerada(s)`);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao gerar pendências');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Gerar pendências retroativas</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Typography variant="body2">
            Cria as entregas de <strong>{tipo.nome}</strong> que faltam, para todas as empresas com a obrigação ativa, a
            partir do mês de entrega abaixo até o mês passado.
          </Typography>
          <DatePicker
            label="A partir do mês de entrega"
            views={['year', 'month']}
            openTo="month"
            format="MM/YYYY"
            value={desde}
            maxDate={dayjs().subtract(1, 'month')}
            onChange={setDesde}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={gerar} disabled={!desde}>
          Gerar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AvulsaDialog({
  open,
  tipo,
  empresas,
  clientes,
  onClose,
  onAviso,
}: SubDialogProps & { empresas: EmpresaDaObrigacao['cliente'][]; clientes: Cliente[] }): React.JSX.Element {
  const [selecionadas, setSelecionadas] = React.useState<Cliente[]>([]);
  const [competencia, setCompetencia] = React.useState<Dayjs | null>(dayjs().startOf('month'));
  const [prazo, setPrazo] = React.useState<Dayjs | null>(null);
  const [prazoTecnico, setPrazoTecnico] = React.useState<Dayjs | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const ids = new Set(empresas.map((e) => e.id));
    setSelecionadas(clientes.filter((c) => ids.has(c.id)));
    setCompetencia(dayjs().startOf('month'));
    setPrazo(null);
    setPrazoTecnico(null);
    setErro(null);
  }, [open, empresas, clientes]);

  async function gerar(): Promise<void> {
    if (selecionadas.length === 0 || !competencia || !prazo) {
      setErro('Escolha as empresas, a competência e o prazo legal');
      return;
    }
    try {
      const r = await api<{ criadas: number; jaExistiam: number }>(`/tipos-obrigacao/${tipo.id}/avulsa`, {
        method: 'POST',
        body: JSON.stringify({
          clienteIds: selecionadas.map((c) => c.id),
          competencia: competencia.format('YYYY-MM'),
          prazo: prazo.endOf('day').toISOString(),
          prazoTecnico: prazoTecnico ? prazoTecnico.endOf('day').toISOString() : null,
        }),
      });
      onAviso(
        `${r.criadas} entrega(s) avulsa(s) criada(s)${r.jaExistiam ? ` · ${r.jaExistiam} já existiam nessa competência` : ''}`
      );
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao gerar avulsas');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gerar demandas avulsas — {tipo.nome}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Autocomplete
            multiple
            options={clientes.filter((c) => c.ativo)}
            value={selecionadas}
            getOptionLabel={(c) => c.razaoSocial}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_e, v) => setSelecionadas(v)}
            renderInput={(params) => <TextField {...params} label="Empresas" />}
            limitTags={4}
          />
          <DatePicker
            label="Competência"
            views={['year', 'month']}
            openTo="month"
            format="MM/YYYY"
            value={competencia}
            onChange={setCompetencia}
          />
          <Stack direction="row" spacing={2}>
            <DatePicker label="Prazo técnico (opcional)" value={prazoTecnico} onChange={setPrazoTecnico} format="DD/MM/YYYY" sx={{ flex: 1 }} />
            <DatePicker label="Prazo legal" value={prazo} onChange={setPrazo} format="DD/MM/YYYY" sx={{ flex: 1 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={gerar}>
          Gerar {selecionadas.length} avulsa(s)
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReplicarDialog({
  open,
  tipo,
  onClose,
  onReplicada,
}: Omit<SubDialogProps, 'onAviso'> & { onReplicada: (copia: TipoObrigacao) => void }): React.JSX.Element {
  const [nome, setNome] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setNome(`${tipo.nome} (cópia)`);
      setErro(null);
    }
  }, [open, tipo.nome]);

  async function replicar(): Promise<void> {
    try {
      const copia = await api<TipoObrigacao>(`/tipos-obrigacao/${tipo.id}/replicar`, {
        method: 'POST',
        body: JSON.stringify({ nome: nome.trim() }),
      });
      onReplicada(copia);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao replicar');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Replicar obrigação</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <TextField label="Nome da nova obrigação" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <Typography color="text.secondary" variant="caption">
            Copia todas as regras de prazo. As empresas não são copiadas.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={replicar} disabled={!nome.trim()}>
          Replicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
