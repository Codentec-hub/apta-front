import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type StatusIntegracao = 'conectado' | 'pendente' | 'nao_configurado';

interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  status: StatusIntegracao;
  campos: { label: string; valor: string }[];
}

const STATUS_LABEL: Record<StatusIntegracao, string> = {
  conectado: 'Conectado',
  pendente: 'Pendente',
  nao_configurado: 'Não configurado',
};

const STATUS_COLOR: Record<StatusIntegracao, 'success' | 'warning' | 'default'> = {
  conectado: 'success',
  pendente: 'warning',
  nao_configurado: 'default',
};

// Dados de exemplo (mock) — nenhuma dessas integrações está de fato ativa ainda.
// Serão configuradas de verdade na Fase 3.1 (Fundação técnica), após o
// levantamento de disponibilidade de API de cada ferramenta.
const INTEGRACOES: Integracao[] = [
  {
    id: 'sieg',
    nome: 'SIEG',
    descricao: 'Captura de XML de notas fiscais, emissão de parcelamentos e certificados digitais.',
    status: 'conectado',
    campos: [
      { label: 'Chave de API', valor: 'sieg_live_••••••••3f2a' },
      { label: 'Última sincronização', valor: 'hoje às 06:12' },
    ],
  },
  {
    id: 'dominioweb',
    nome: 'DominioWeb',
    descricao: 'Sistema de contabilidade — escrituração e integração fiscal/contábil.',
    status: 'pendente',
    campos: [
      { label: 'Usuário de integração', valor: 'apta.integracao' },
      { label: 'Ambiente', valor: 'Produção' },
    ],
  },
  {
    id: 'suri',
    nome: 'Suri',
    descricao: 'Atendimento ao cliente — fila de espera, mensagens automáticas e relatórios.',
    status: 'conectado',
    campos: [
      { label: 'Token de acesso', valor: 'suri_••••••••91cd' },
      { label: 'Webhook', valor: 'https://api.sistemaapta.com.br/webhooks/suri' },
    ],
  },
  {
    id: 'conta-azul',
    nome: 'Conta Azul',
    descricao: 'Financeiro do escritório e dos clientes de BPO — contas, DRE e fluxo de caixa.',
    status: 'nao_configurado',
    campos: [
      { label: 'Client ID', valor: '—' },
      { label: 'Client Secret', valor: '—' },
    ],
  },
  {
    id: 'acessorias',
    nome: 'Acessorias',
    descricao: 'Envio de obrigações — será substituído pelo módulo interno de Obrigações.',
    status: 'pendente',
    campos: [{ label: 'Situação', valor: 'Migração planejada para a Fase 3.3' }],
  },
  {
    id: 'governo',
    nome: 'eSocial / DCTFWeb / FGTS Digital',
    descricao: 'Transmissões obrigatórias ao governo para a folha de pagamento.',
    status: 'nao_configurado',
    campos: [{ label: 'Certificado digital', valor: 'Não cadastrado' }],
  },
  {
    id: 'open-finance',
    nome: 'Open Finance',
    descricao: 'Conexão bancária direta para conciliação contábil automática.',
    status: 'nao_configurado',
    campos: [{ label: 'Instituições conectadas', valor: '0' }],
  },
];

export function IntegracoesGrid(): React.JSX.Element {
  return (
    <Grid container spacing={2}>
      {INTEGRACOES.map((integracao) => (
        <Grid key={integracao.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">{integracao.nome}</Typography>
                <Chip
                  color={STATUS_COLOR[integracao.status]}
                  label={STATUS_LABEL[integracao.status]}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography color="text.secondary" variant="body2">
                {integracao.descricao}
              </Typography>
              <Stack spacing={1} divider={<Divider />} sx={{ mt: 1 }}>
                {integracao.campos.map((campo) => (
                  <Stack key={campo.label} spacing={0.25}>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    >
                      {campo.label}
                    </Typography>
                    <Typography sx={{ fontFamily: 'var(--font-roboto-mono, monospace)', wordBreak: 'break-word' }}>
                      {campo.valor}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Button disabled sx={{ mt: 'auto' }} title="Disponível após o diagnóstico técnico da Fase 3.1">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
