'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import dayjs from 'dayjs';

import { config } from '@/config';
import { formatarTamanho } from '@/lib/documentos-entrega';
import { formatarCompetencia } from '@/lib/obrigacao-status';

interface EntregaPublicaDados {
  numero: number;
  destinatarioNome: string;
  createdAt: string;
  empresa: { razaoSocial: string; cnpj: string };
  obrigacao: { nome: string; competencia: string | null; competenciaAnual: boolean; prazo: string; entregueEm: string | null };
  documentos: { id: string; nomeArquivo: string; tamanho: number }[];
}

export function EntregaPublica({ token }: { token: string }): React.JSX.Element {
  const [dados, setDados] = React.useState<EntregaPublicaDados | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${config.apiUrl}/publico/entregas/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Este link é inválido ou foi cancelado.' : 'Não foi possível carregar os documentos.');
        setDados((await res.json()) as EntregaPublicaDados);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'));
  }, [token]);

  const urlDocumento = (id: string, download = false) =>
    `${config.apiUrl}/publico/entregas/${encodeURIComponent(token)}/documentos/${id}${download ? '?download=1' : ''}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--mui-palette-background-default)', display: 'flex', justifyContent: 'center', px: 2, py: 6 }}>
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 560 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box component="img" src="/apta-logo.png" alt="" sx={{ height: 40, width: 40 }} />
          <Typography variant="h6">Apta Contabilidade</Typography>
        </Stack>

        {erro ? <Alert severity="error">{erro}</Alert> : null}
        {!dados && !erro ? <Typography color="text.secondary">Carregando…</Typography> : null}

        {dados ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <div>
                  <Typography variant="overline" color="text.secondary">
                    Protocolo de entrega nº {dados.numero}
                  </Typography>
                  <Typography variant="h5">{dados.obrigacao.nome}</Typography>
                  <Typography color="text.secondary">{dados.empresa.razaoSocial}</Typography>
                </div>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Competência
                    </Typography>
                    <Typography variant="body2">
                      {formatarCompetencia(dados.obrigacao.competencia, dados.obrigacao.competenciaAnual)}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Vencimento
                    </Typography>
                    <Typography variant="body2">{dayjs(dados.obrigacao.prazo).format('DD/MM/YYYY')}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Para
                    </Typography>
                    <Typography variant="body2">{dados.destinatarioNome}</Typography>
                  </div>
                </Stack>
                <Divider />
                {dados.documentos.length === 0 ? (
                  <Typography color="text.secondary">Nenhum documento disponível.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {dados.documentos.map((d) => (
                      <Stack key={d.id} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <FileTextIcon fontSize="var(--icon-fontSize-lg)" />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap title={d.nomeArquivo}>
                            {d.nomeArquivo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatarTamanho(d.tamanho)}
                          </Typography>
                        </Box>
                        <Button size="small" variant="contained" href={urlDocumento(d.id)} target="_blank" rel="noopener">
                          Abrir
                        </Button>
                        <Button size="small" href={urlDocumento(d.id, true)} startIcon={<DownloadSimpleIcon />}>
                          Baixar
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Em caso de dúvida, fale com a Apta Contabilidade pelos canais de atendimento de sempre.
        </Typography>
      </Stack>
    </Box>
  );
}
