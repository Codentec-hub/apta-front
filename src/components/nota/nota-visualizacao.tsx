"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FileCodeIcon } from "@phosphor-icons/react/dist/ssr/FileCode";
import { PrinterIcon } from "@phosphor-icons/react/dist/ssr/Printer";
import dayjs from "dayjs";

import { paths } from "@/paths";
import { api, getToken } from "@/lib/api";
import { formatarDocumento } from "@/lib/empresa";
import { baixarArquivoApi, formatarMoeda } from "@/lib/sieg";

interface Parte {
	documento: string | null;
	nome: string | null;
	fantasia: string | null;
	ie: string | null;
	im: string | null;
	endereco: string | null;
	municipio: string | null;
	uf: string | null;
	cep: string | null;
	fone: string | null;
}

interface Detalhe {
	tipo: "nfe" | "nfce" | "nfse" | "cte" | "cfe" | "outro";
	modelo: string | null;
	chave: string | null;
	numero: string | null;
	serie: string | null;
	emissao: string | null;
	saidaEntrada: "entrada" | "saida" | null;
	naturezaOperacao: string | null;
	protocolo: { numero: string | null; data: string | null } | null;
	emitente: Parte;
	destinatario: Parte;
	itens: {
		numero: number;
		codigo: string | null;
		descricao: string | null;
		ncm: string | null;
		cfop: string | null;
		unidade: string | null;
		quantidade: number | null;
		valorUnitario: number | null;
		valorTotal: number | null;
		baseIcms: number | null;
		aliquotaIcms: number | null;
		valorIcms: number | null;
		valorIpi: number | null;
	}[];
	totais: Record<string, number | null>;
	transporte: { modalidade: string | null; transportadora: string | null; documento: string | null } | null;
	duplicatas: { numero: string | null; vencimento: string | null; valor: number | null }[];
	servico: { descricao: string | null; codigo: string | null; municipio: string | null } | null;
	informacoes: string | null;
	cancelada: boolean;
}

const TITULO: Record<Detalhe["tipo"], string> = {
	nfe: "DANFE · Documento Auxiliar da Nota Fiscal Eletrônica",
	nfce: "DANFE NFC-e · Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica",
	nfse: "Nota Fiscal de Serviço Eletrônica (NFS-e)",
	cte: "Conhecimento de Transporte Eletrônico (CT-e)",
	cfe: "Cupom Fiscal Eletrônico (CF-e SAT)",
	outro: "Documento fiscal",
};

const borda = "1px solid #222";

function Celula({
	rotulo,
	children,
	flex = 1,
	alinhar = "left",
}: {
	rotulo: string;
	children: React.ReactNode;
	flex?: number;
	alinhar?: "left" | "right" | "center";
}): React.JSX.Element {
	return (
		<Box sx={{ flex, border: borda, px: 0.75, py: 0.25, minWidth: 0, textAlign: alinhar }}>
			<Typography sx={{ fontSize: 9, textTransform: "uppercase", color: "#444", lineHeight: 1.3 }}>{rotulo}</Typography>
			<Typography sx={{ fontSize: 12, lineHeight: 1.35, wordBreak: "break-word", minHeight: 16 }}>{children ?? ""}</Typography>
		</Box>
	);
}

const Linha = ({ children }: { children: React.ReactNode }) => (
	<Box sx={{ display: "flex", "& > *:not(:first-of-type)": { borderLeft: "none" }, mt: "-1px" }}>{children}</Box>
);

const Secao = ({ titulo }: { titulo: string }) => (
	<Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", mt: 1.25, mb: 0.25 }}>{titulo}</Typography>
);

const doc = (v: string | null) => (v ? formatarDocumento(v) : "");
const chaveFormatada = (c: string | null) => (c ? c.replaceAll(/(\d{4})(?=\d)/g, "$1 ") : "");
const quantidade = (v: number | null) =>
	v === null ? "" : v.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const moeda = (v: number | null | undefined) => (v === null || v === undefined ? "" : formatarMoeda(v));

function BlocoParte({ titulo, p }: { titulo: string; p: Parte }): React.JSX.Element {
	return (
		<>
			<Secao titulo={titulo} />
			<Linha>
				<Celula rotulo="Nome / razão social" flex={3}>
					{p.nome}
				</Celula>
				<Celula rotulo="CNPJ / CPF">{doc(p.documento)}</Celula>
			</Linha>
			<Linha>
				<Celula rotulo="Endereço" flex={3}>
					{p.endereco}
				</Celula>
				<Celula rotulo="CEP">{p.cep}</Celula>
			</Linha>
			<Linha>
				<Celula rotulo="Município" flex={2}>
					{p.municipio}
				</Celula>
				<Celula rotulo="UF" flex={0.5}>
					{p.uf}
				</Celula>
				<Celula rotulo="Inscrição estadual">{p.ie}</Celula>
				<Celula rotulo="Inscrição municipal">{p.im}</Celula>
			</Linha>
		</>
	);
}

export function NotaVisualizacao({ chave }: { chave: string }): React.JSX.Element {
	const [d, setD] = React.useState<Detalhe | null>(null);
	const [erro, setErro] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!getToken()) {
			globalThis.location.href = paths.auth.signIn;
			return;
		}
		api<Detalhe>(`/sieg/dados/notas/${encodeURIComponent(chave)}/detalhe`)
			.then(setD)
			.catch((error: unknown) => setErro(error instanceof Error ? error.message : "Erro ao carregar a nota"));
	}, [chave]);

	const t = d?.totais ?? {};

	return (
		<Box sx={{ bgcolor: "#f3f4f6", minHeight: "100vh", py: 3, px: 2, "@media print": { bgcolor: "#fff", p: 0 } }}>
			<Stack
				direction="row"
				spacing={1}
				sx={{ maxWidth: 900, mx: "auto", mb: 2, justifyContent: "flex-end", displayPrint: "none" }}
			>
				<Button
					variant="outlined"
					startIcon={<FileCodeIcon />}
					onClick={() => void baixarArquivoApi(`/sieg/dados/notas/${encodeURIComponent(chave)}/xml`, `${chave}.xml`)}
				>
					Baixar XML
				</Button>
				<Button variant="contained" startIcon={<PrinterIcon />} disabled={!d} onClick={() => globalThis.print()}>
					Imprimir / salvar PDF
				</Button>
			</Stack>

			{erro ? (
				<Alert severity="error" sx={{ maxWidth: 900, mx: "auto" }}>
					{erro}
				</Alert>
			) : null}
			{!d && !erro ? (
				<Box sx={{ textAlign: "center", py: 6 }}>
					<CircularProgress />
				</Box>
			) : null}

			{d ? (
				<Box
					sx={{
						bgcolor: "#fff",
						color: "#111",
						maxWidth: 900,
						mx: "auto",
						p: 2.5,
						boxShadow: 1,
						position: "relative",
						"@media print": { boxShadow: "none", p: 0, maxWidth: "none" },
					}}
				>
					{d.cancelada ? (
						<Typography
							sx={{
								position: "absolute",
								top: 220,
								left: 0,
								right: 0,
								textAlign: "center",
								fontSize: 72,
								fontWeight: 800,
								color: "rgba(200,0,0,0.18)",
								transform: "rotate(-20deg)",
								pointerEvents: "none",
							}}
						>
							CANCELADA
						</Typography>
					) : null}

					{/* Cabeçalho */}
					<Box sx={{ display: "flex" }}>
						<Box sx={{ flex: 3, border: borda, p: 1 }}>
							<Typography sx={{ fontSize: 14, fontWeight: 700 }}>{d.emitente.nome}</Typography>
							{d.emitente.fantasia ? <Typography sx={{ fontSize: 11 }}>{d.emitente.fantasia}</Typography> : null}
							<Typography sx={{ fontSize: 11 }}>
								{[d.emitente.endereco, d.emitente.municipio && `${d.emitente.municipio}/${d.emitente.uf ?? ""}`, d.emitente.cep && `CEP ${d.emitente.cep}`]
									.filter(Boolean)
									.join(" · ")}
							</Typography>
							{d.emitente.fone ? <Typography sx={{ fontSize: 11 }}>Fone {d.emitente.fone}</Typography> : null}
						</Box>
						<Box sx={{ flex: 2, border: borda, borderLeft: "none", p: 1, textAlign: "center" }}>
							<Typography sx={{ fontSize: 11, fontWeight: 700 }}>{TITULO[d.tipo]}</Typography>
							{d.saidaEntrada ? (
								<Typography sx={{ fontSize: 11 }}>{d.saidaEntrada === "saida" ? "1 - Saída" : "0 - Entrada"}</Typography>
							) : null}
							<Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.5 }}>
								Nº {d.numero ?? "—"}
								{d.serie ? ` · Série ${d.serie}` : ""}
							</Typography>
							<Typography sx={{ fontSize: 11 }}>
								Emissão {d.emissao ? dayjs(d.emissao).format("DD/MM/YYYY HH:mm") : "—"}
							</Typography>
						</Box>
					</Box>
					{d.chave ? (
						<Linha>
							<Celula rotulo="Chave de acesso" alinhar="center">
								<Box component="span" sx={{ fontFamily: "monospace", fontSize: 13, letterSpacing: 0.5 }}>
									{chaveFormatada(d.chave)}
								</Box>
							</Celula>
						</Linha>
					) : null}
					<Linha>
						{d.naturezaOperacao ? (
							<Celula rotulo="Natureza da operação" flex={2}>
								{d.naturezaOperacao}
							</Celula>
						) : null}
						{d.protocolo ? (
							<Celula rotulo="Protocolo de autorização" flex={2}>
								{d.protocolo.numero}
								{d.protocolo.data ? ` · ${dayjs(d.protocolo.data).format("DD/MM/YYYY HH:mm")}` : ""}
							</Celula>
						) : null}
						<Celula rotulo="CNPJ do emitente">{doc(d.emitente.documento)}</Celula>
						<Celula rotulo="IE do emitente">{d.emitente.ie}</Celula>
					</Linha>

					{d.destinatario.nome || d.destinatario.documento ? (
						<BlocoParte titulo={d.tipo === "nfse" ? "Tomador do serviço" : "Destinatário / remetente"} p={d.destinatario} />
					) : null}

					{d.duplicatas.length > 0 ? (
						<>
							<Secao titulo="Fatura / duplicatas" />
							<Box sx={{ display: "flex", flexWrap: "wrap" }}>
								{d.duplicatas.map((dup, i) => (
									<Box key={i} sx={{ border: borda, px: 0.75, py: 0.25, mr: "-1px", mb: "-1px", minWidth: 160 }}>
										<Typography sx={{ fontSize: 11 }}>
											{dup.numero} · {dup.vencimento ? dayjs(dup.vencimento).format("DD/MM/YYYY") : ""} · {moeda(dup.valor)}
										</Typography>
									</Box>
								))}
							</Box>
						</>
					) : null}

					{d.tipo === "nfse" ? (
						<>
							<Secao titulo="Discriminação do serviço" />
							<Linha>
								<Celula rotulo="Descrição" flex={4}>
									{d.servico?.descricao}
								</Celula>
							</Linha>
							<Linha>
								<Celula rotulo="Código do serviço">{d.servico?.codigo}</Celula>
								<Celula rotulo="Local da prestação">{d.servico?.municipio}</Celula>
							</Linha>
							<Secao titulo="Valores" />
							<Linha>
								<Celula rotulo="Valor do serviço" alinhar="right">
									{moeda(t["vServ"])}
								</Celula>
								<Celula rotulo="ISS" alinhar="right">
									{moeda(t["vISS"])}
								</Celula>
								<Celula rotulo="Retenções" alinhar="right">
									{moeda(t["vRet"])}
								</Celula>
								<Celula rotulo="Valor líquido" alinhar="right">
									<strong>{moeda(t["vLiq"])}</strong>
								</Celula>
							</Linha>
						</>
					) : null}

					{d.tipo === "nfe" || d.tipo === "nfce" ? (
						<>
							<Secao titulo="Cálculo do imposto" />
							<Linha>
								<Celula rotulo="Base de cálculo do ICMS" alinhar="right">
									{moeda(t["vBC"])}
								</Celula>
								<Celula rotulo="Valor do ICMS" alinhar="right">
									{moeda(t["vICMS"])}
								</Celula>
								<Celula rotulo="Base ICMS ST" alinhar="right">
									{moeda(t["vBCST"])}
								</Celula>
								<Celula rotulo="Valor ICMS ST" alinhar="right">
									{moeda(t["vST"])}
								</Celula>
								<Celula rotulo="Valor dos produtos" alinhar="right">
									{moeda(t["vProd"])}
								</Celula>
							</Linha>
							<Linha>
								<Celula rotulo="Frete" alinhar="right">
									{moeda(t["vFrete"])}
								</Celula>
								<Celula rotulo="Seguro" alinhar="right">
									{moeda(t["vSeg"])}
								</Celula>
								<Celula rotulo="Desconto" alinhar="right">
									{moeda(t["vDesc"])}
								</Celula>
								<Celula rotulo="Outras despesas" alinhar="right">
									{moeda(t["vOutro"])}
								</Celula>
								<Celula rotulo="Valor do IPI" alinhar="right">
									{moeda(t["vIPI"])}
								</Celula>
								<Celula rotulo="Valor total da nota" alinhar="right">
									<strong>{moeda(t["vNF"])}</strong>
								</Celula>
							</Linha>

							{d.transporte ? (
								<>
									<Secao titulo="Transportador" />
									<Linha>
										<Celula rotulo="Razão social" flex={2}>
											{d.transporte.transportadora}
										</Celula>
										<Celula rotulo="Frete">{d.transporte.modalidade}</Celula>
										<Celula rotulo="CNPJ / CPF">{doc(d.transporte.documento)}</Celula>
									</Linha>
								</>
							) : null}

							<Secao titulo="Dados dos produtos / serviços" />
							<Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { border: borda, px: 0.5, py: 0.25, fontSize: 10.5 }, "& th": { fontSize: 9, textTransform: "uppercase", bgcolor: "#f5f5f5" } }}>
								<thead>
									<tr>
										<th>Código</th>
										<th style={{ width: "34%" }}>Descrição</th>
										<th>NCM</th>
										<th>CFOP</th>
										<th>Un</th>
										<th>Qtd</th>
										<th>V. unit.</th>
										<th>V. total</th>
										<th>BC ICMS</th>
										<th>V. ICMS</th>
										<th>Alíq.</th>
									</tr>
								</thead>
								<tbody>
									{d.itens.map((i) => (
										<tr key={i.numero}>
											<td>{i.codigo}</td>
											<td>{i.descricao}</td>
											<td>{i.ncm}</td>
											<td>{i.cfop}</td>
											<td>{i.unidade}</td>
											<td style={{ textAlign: "right" }}>{quantidade(i.quantidade)}</td>
											<td style={{ textAlign: "right" }}>{moeda(i.valorUnitario)}</td>
											<td style={{ textAlign: "right" }}>{moeda(i.valorTotal)}</td>
											<td style={{ textAlign: "right" }}>{moeda(i.baseIcms)}</td>
											<td style={{ textAlign: "right" }}>{moeda(i.valorIcms)}</td>
											<td style={{ textAlign: "right" }}>{i.aliquotaIcms === null ? "" : `${quantidade(i.aliquotaIcms)}%`}</td>
										</tr>
									))}
								</tbody>
							</Box>
						</>
					) : null}

					{d.tipo !== "nfe" && d.tipo !== "nfce" && d.tipo !== "nfse" ? (
						<>
							<Secao titulo="Valor" />
							<Linha>
								<Celula rotulo="Valor total" alinhar="right">
									<strong>{moeda(t["vNF"])}</strong>
								</Celula>
							</Linha>
						</>
					) : null}

					{d.informacoes ? (
						<>
							<Secao titulo="Informações complementares" />
							<Box sx={{ border: borda, p: 0.75 }}>
								<Typography sx={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{d.informacoes}</Typography>
							</Box>
						</>
					) : null}

					<Typography sx={{ fontSize: 9, color: "#666", mt: 1.5 }}>
						Representação gerada pelo Sistema Apta a partir do XML autorizado. Consulte a autenticidade pela chave de
						acesso no portal da Receita/prefeitura.
					</Typography>
				</Box>
			) : null}
		</Box>
	);
}
