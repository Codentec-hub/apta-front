'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

interface Escritorio {
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  crc: string | null;
  responsavelTecnico: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  endereco: string | null;
  cidade: string;
  uf: string;
  assinaturaMensagens: string | null;
}

type Campo = keyof Escritorio;

const VAZIO: Escritorio = {
  nome: '',
  razaoSocial: null,
  cnpj: null,
  crc: null,
  responsavelTecnico: null,
  email: null,
  telefone: null,
  whatsapp: null,
  site: null,
  endereco: null,
  cidade: '',
  uf: '',
  assinaturaMensagens: null,
};

export function EscritorioView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = user?.perfil === 'ADMIN';
  const [dados, setDados] = React.useState<Escritorio>(VAZIO);
  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    api<Escritorio>('/configuracoes/escritorio')
      .then(setDados)
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'))
      .finally(() => setCarregando(false));
  }, []);

  const campo = (nome: Campo, rotulo: string, extra: { md?: number; helper?: string; multiline?: boolean } = {}) => (
    <Grid size={{ xs: 12, md: extra.md ?? 6 }}>
      <TextField
        fullWidth
        label={rotulo}
        value={dados[nome] ?? ''}
        onChange={(e) => {
          setOk(false);
          setDados((d) => ({ ...d, [nome]: e.target.value }));
        }}
        disabled={!podeEditar || carregando}
        helperText={extra.helper}
        multiline={extra.multiline}
        minRows={extra.multiline ? 2 : undefined}
      />
    </Grid>
  );

  async function salvar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      setDados(await api<Escritorio>('/configuracoes/escritorio', { method: 'PUT', body: JSON.stringify(dados) }));
      setOk(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Dados do escritório</Typography>
        <Typography color="text.secondary" variant="body2">
          Aparecem nos e-mails ao cliente, no protocolo de entrega e no relatório de saúde fiscal. A cidade e a UF definem os
          feriados usados nos prazos.
        </Typography>
      </div>
      {podeEditar ? null : <Alert severity="info">Só o administrador pode alterar estes dados.</Alert>}
      <Card>
        <CardHeader title="Identificação" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {campo('nome', 'Nome do escritório (como aparece ao cliente)')}
            {campo('razaoSocial', 'Razão social')}
            {campo('cnpj', 'CNPJ', { md: 4 })}
            {campo('crc', 'Registro no CRC', { md: 4 })}
            {campo('responsavelTecnico', 'Responsável técnico', { md: 4 })}
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Contato e endereço" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {campo('email', 'E-mail', { md: 4 })}
            {campo('telefone', 'Telefone', { md: 4 })}
            {campo('whatsapp', 'WhatsApp', { md: 4 })}
            {campo('site', 'Site', { md: 4 })}
            {campo('endereco', 'Endereço', { md: 8 })}
            {campo('cidade', 'Cidade', { md: 8 })}
            {campo('uf', 'UF', { md: 4, helper: 'Sigla com 2 letras, ex.: CE' })}
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Mensagens ao cliente" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {campo('assinaturaMensagens', 'Assinatura das mensagens', {
              md: 12,
              multiline: true,
              helper: 'Vai no fim dos e-mails e WhatsApps da saúde fiscal. Em branco, usa o nome do escritório.',
            })}
          </Grid>
        </CardContent>
      </Card>
      {erro ? <Alert severity="error">{erro}</Alert> : null}
      {ok ? <Alert severity="success">Dados do escritório salvos.</Alert> : null}
      {podeEditar ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => void salvar()} disabled={salvando || carregando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
