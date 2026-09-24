'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { api } from '@/lib/api';
import type { ConjuntoObrigacoes, TipoObrigacao } from '@/types/domain';

export interface ConjuntosObrigacoesProps {
  tipo: 'regime' | 'grupo';
  conjuntos: ConjuntoObrigacoes[];
  tipos: TipoObrigacao[];
  onChange: (conjuntos: ConjuntoObrigacoes[]) => void;
  onErro: (mensagem: string) => void;
}

const TEXTOS = {
  regime: {
    endpoint: '/regimes',
    novo: 'Novo regime',
    singular: 'regime',
    explicacao:
      'Aplicar um regime a uma empresa SUBSTITUI as obrigações dela pelas do regime — as que não fazem parte ficam inativas (o histórico de entregas é mantido).',
  },
  grupo: {
    endpoint: '/grupos-obrigacao',
    novo: 'Novo grupo',
    singular: 'grupo',
    explicacao:
      'Um grupo ADICIONA obrigações à empresa sem remover as que já existem. Útil no cadastro de cliente novo: cada departamento inclui o seu grupo e o Fiscal define o regime no final.',
  },
} as const;

// Regimes tributários e grupos de obrigações: ambos são um nome + conjunto
// de obrigações do cadastro; a diferença está em como são aplicados.
export function ConjuntosObrigacoes({ tipo, conjuntos, tipos, onChange, onErro }: ConjuntosObrigacoesProps): React.JSX.Element {
  const textos = TEXTOS[tipo];
  const tipoPorId = React.useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos]);
  const [editando, setEditando] = React.useState<ConjuntoObrigacoes | null>(null);
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [nome, setNome] = React.useState('');
  const [selecionados, setSelecionados] = React.useState<Set<string>>(new Set());
  const [erro, setErro] = React.useState<string | null>(null);

  const porSetor = React.useMemo(() => {
    const grupos = new Map<string, TipoObrigacao[]>();
    for (const t of tipos.filter((x) => x.ativo)) {
      grupos.set(t.setor.nome, [...(grupos.get(t.setor.nome) ?? []), t]);
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tipos]);

  function abrir(conjunto: ConjuntoObrigacoes | null): void {
    setEditando(conjunto);
    setNome(conjunto?.nome ?? '');
    setSelecionados(new Set(conjunto?.tipoIds ?? []));
    setErro(null);
    setDialogAberto(true);
  }

  function alternar(id: string): void {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function salvar(): Promise<void> {
    if (!nome.trim()) {
      setErro('Informe o nome');
      return;
    }
    try {
      const body = JSON.stringify({ nome: nome.trim(), tipoIds: [...selecionados] });
      const salvo = editando
        ? await api<ConjuntoObrigacoes>(`${textos.endpoint}/${editando.id}`, { method: 'PUT', body })
        : await api<ConjuntoObrigacoes>(textos.endpoint, { method: 'POST', body });
      onChange(
        (editando ? conjuntos.map((c) => (c.id === salvo.id ? salvo : c)) : [...conjuntos, salvo]).sort((a, b) =>
          a.nome.localeCompare(b.nome)
        )
      );
      setDialogAberto(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    }
  }

  async function excluir(conjunto: ConjuntoObrigacoes): Promise<void> {
    try {
      await api(`${textos.endpoint}/${conjunto.id}`, { method: 'DELETE' });
      onChange(conjuntos.filter((c) => c.id !== conjunto.id));
    } catch (error) {
      onErro(error instanceof Error ? error.message : 'Erro ao excluir');
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="info" sx={{ flex: 1 }}>
          {textos.explicacao}
        </Alert>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={() => abrir(null)} sx={{ flexShrink: 0 }}>
          {textos.novo}
        </Button>
      </Stack>

      {conjuntos.length === 0 ? (
        <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
          Nenhum {textos.singular} cadastrado.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
          {conjuntos.map((c) => (
            <Card key={c.id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{c.nome}</Typography>
                <Typography color="text.secondary" variant="caption">
                  {c.tipoIds.length} obrigação(ões)
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                  {c.tipoIds
                    .flatMap((id) => tipoPorId.get(id) ?? [])
                    .sort((a, b) => a.setor.nome.localeCompare(b.setor.nome) || a.nome.localeCompare(b.nome))
                    .map((t) => (
                      <Chip key={t.id} label={t.nome} size="small" variant="outlined" title={t.setor.nome} />
                    ))}
                </Stack>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<PencilSimpleIcon />} onClick={() => abrir(c)}>
                  Editar
                </Button>
                <Button size="small" color="error" startIcon={<TrashIcon />} onClick={() => excluir(c)}>
                  Excluir
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? `Editar ${textos.singular}` : textos.novo}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required fullWidth />
            {porSetor.map(([setor, doSetor]) => (
              <Box key={setor}>
                <Typography variant="subtitle2">{setor}</Typography>
                <Stack>
                  {doSetor.map((t) => (
                    <FormControlLabel
                      key={t.id}
                      control={<Checkbox size="small" checked={selecionados.has(t.id)} onChange={() => alternar(t.id)} />}
                      label={t.nome}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar}>
            Salvar ({selecionados.size})
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
