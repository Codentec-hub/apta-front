'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { CircleIcon } from '@phosphor-icons/react/dist/ssr/Circle';

import type { Cliente, ConjuntoObrigacoes, Setor, UsuarioResumo } from '@/types/domain';
import { paths } from '@/paths';
import { api } from '@/lib/api';

interface Passo {
  titulo: string;
  detalhe: string;
  feito: boolean;
  href: string;
  acao: string;
}

// Roteiro de implantação para uma base nova: some sozinho quando tudo estiver
// feito. Cada passo é o que a jornada seguinte precisa (sem responsável no
// setor, a entrega fica "sem responsável"; sem contato com e-mail, o
// protocolo não tem para quem ir).
export function PrimeirosPassos(): React.JSX.Element | null {
  const [passos, setPassos] = React.useState<Passo[] | null>(null);

  React.useEffect(() => {
    Promise.all([
      api<UsuarioResumo[]>('/usuarios'),
      api<Setor[]>('/setores'),
      api<ConjuntoObrigacoes[]>('/regimes'),
      api<Cliente[]>('/clientes'),
    ])
      .then(([usuarios, setores, regimes, clientes]) => {
        const ativos = clientes.filter((c) => c.ativo);
        const semContatoComEmail = ativos.filter((c) => !(c.contatos ?? []).some((ct) => ct.email)).length;
        const setoresSemResponsavel = setores.filter((s) => !s.responsavelId).length;
        setPassos([
          {
            titulo: 'Cadastrar a equipe',
            detalhe: 'Usuários do escritório, com perfil e setor.',
            feito: usuarios.filter((u) => u.ativo).length > 1,
            href: paths.dashboard.usuarios,
            acao: 'Usuários',
          },
          {
            titulo: 'Definir o responsável de cada setor',
            detalhe:
              setoresSemResponsavel > 0
                ? `${setoresSemResponsavel} setor(es) sem responsável padrão: as entregas ficam "sem responsável".`
                : 'Todos os setores têm responsável padrão.',
            feito: setores.length > 0 && setoresSemResponsavel === 0,
            href: paths.dashboard.setores,
            acao: 'Setores',
          },
          {
            titulo: 'Revisar obrigações e regimes',
            detalhe: 'Cada regime traz suas obrigações para o cliente. Confira prazos e o que cada regime inclui.',
            feito: regimes.some((r) => r.tipoIds.length > 0),
            href: paths.dashboard.obrigacoes,
            acao: 'Obrigações',
          },
          {
            titulo: 'Cadastrar os clientes',
            detalhe: 'Com o regime tributário: as obrigações e as entregas já são geradas.',
            feito: ativos.length > 0,
            href: paths.dashboard.clientes,
            acao: 'Clientes',
          },
          {
            titulo: 'Contatos com e-mail em cada cliente',
            detalhe:
              ativos.length === 0
                ? 'Quem recebe as guias e declarações (protocolo de entrega).'
                : semContatoComEmail > 0
                  ? `${semContatoComEmail} cliente(s) sem contato com e-mail: o protocolo não tem para quem ir.`
                  : 'Todos os clientes têm quem receba os documentos.',
            feito: ativos.length > 0 && semContatoComEmail === 0,
            href: paths.dashboard.clientes,
            acao: 'Clientes',
          },
        ]);
      })
      .catch(() => setPassos(null));
  }, []);

  if (!passos || passos.every((p) => p.feito)) return null;

  const feitos = passos.filter((p) => p.feito).length;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Primeiros passos</Typography>
          <Typography variant="body2" color="text.secondary">
            {feitos} de {passos.length} concluídos. Este quadro some quando tudo estiver pronto.
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(feitos / passos.length) * 100}
            sx={{ mt: 1, borderRadius: 1 }}
          />
        </Stack>
        {passos.map((passo) => (
          <Stack key={passo.titulo} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ color: passo.feito ? 'success.main' : 'text.disabled', display: 'flex', flex: '0 0 auto' }}>
              {passo.feito ? <CheckCircleIcon size={22} weight="fill" /> : <CircleIcon size={22} />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={passo.feito ? { textDecoration: 'line-through', color: 'text.secondary' } : undefined}
              >
                {passo.titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {passo.detalhe}
              </Typography>
            </Box>
            {passo.feito ? null : (
              <Button size="small" variant="outlined" component={RouterLink} href={passo.href}>
                {passo.acao}
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
