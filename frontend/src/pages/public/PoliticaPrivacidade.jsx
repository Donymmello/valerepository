import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { NOME_PLATAFORMA, NOME_EMPRESA } from "../../theme";

/*
  ==========================================================
  POLÍTICA DE PRIVACIDADE
  ==========================================================
  O texto é o rascunho de docs/POLITICA-DE-PRIVACIDADE.md, escrito a
  partir do levantamento real do que o sistema recolhe e para onde envia.

  ATENÇÃO: há valores por preencher em DADOS_EMPRESA abaixo, e o documento
  NÃO foi revisto por advogado. Enquanto PUBLICADA for false, a página
  mostra um aviso visível e não é ligada a partir do rodapé.

  Para publicar: preenche DADOS_EMPRESA, manda rever, e põe PUBLICADA a
  true. Está tudo num sítio de propósito.
*/

const PUBLICADA = false;

const DADOS_EMPRESA = {
  morada: "[PREENCHER: morada da sede]",
  nuit: "[PREENCHER: NUIT]",
  emailPrivacidade: "[PREENCHER: ex. privacidade@vektramz.com]",
  prazoResposta: "30 dias",
  ultimaAtualizacao: "[PREENCHER: data de publicação]",
  retencao: "[PREENCHER: prazos de conservação — ver secção 5 do rascunho]",
};

function Seccao({ titulo, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        {titulo}
      </Typography>
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}

function P({ children }) {
  return (
    <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
      {children}
    </Typography>
  );
}

export default function PoliticaPrivacidade() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 5, md: 8 } }}>
      <Container maxWidth="md">
        {!PUBLICADA && (
          <Box
            sx={{
              bgcolor: "#fff4e5",
              border: "1px solid #ffb74d",
              borderRadius: 2,
              p: 2,
              mb: 4,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Rascunho, não publicado
            </Typography>
            <Typography variant="body2">
              Este documento ainda não foi revisto juridicamente e tem campos por
              preencher. Não deve ser considerado a política em vigor.
            </Typography>
          </Box>
        )}

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Política de Privacidade
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
          {NOME_PLATAFORMA} — última atualização: {DADOS_EMPRESA.ultimaAtualizacao}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Seccao titulo="1. Quem trata os dados">
          <P>
            A plataforma {NOME_PLATAFORMA} é operada pela {NOME_EMPRESA},
            com sede em {DADOS_EMPRESA.morada}, NUIT {DADOS_EMPRESA.nuit}.
          </P>
          <P>
            Há aqui uma distinção que determina a quem te deves dirigir. A{" "}
            <strong>financeira</strong> com quem tens o crédito é a responsável
            pelo tratamento: é ela que decide recolher os teus dados, para que
            fim e durante quanto tempo. A {NOME_EMPRESA} é subcontratante:
            fornece a plataforma e trata os dados por instrução dessa financeira.
          </P>
          <P>
            Na prática, isto significa que os pedidos sobre os teus dados se
            fazem <strong>à financeira</strong>, não a nós. Para assuntos sobre
            a plataforma em si: {DADOS_EMPRESA.emailPrivacidade}.
          </P>
        </Seccao>

        <Seccao titulo="2. Que dados são tratados">
          <P>
            <strong>Do mutuário:</strong> nome completo, tipo e número de
            documento de identificação, NUIT, data de nascimento, telefone,
            email, província, distrito e local de residência.
          </P>
          <P>
            <strong>Do crédito:</strong> pedidos e respetivos valores e
            finalidade, créditos ativos, plano de parcelas, pagamentos
            efetuados, atrasos e situação de incumprimento.
          </P>
          <P>
            <strong>Documentos:</strong> ficheiros carregados como requisitos do
            pedido — tipicamente documento de identificação, comprovativo de
            rendimento e comprovativo de morada — e comprovativos de pagamento.
          </P>
          <P>
            <strong>Dos utilizadores da financeira:</strong> nome, email, perfil
            de acesso e palavra-passe, esta última guardada apenas em forma
            cifrada irreversível, nunca em texto legível.
          </P>
          <P>
            <strong>Registo de atividade:</strong> o sistema regista quem
            executou cada ação sensível, sobre que registo e quando. Serve para
            auditoria e para apurar responsabilidade.
          </P>
          <P>
            <strong>Dados técnicos:</strong> o servidor regista endereço IP,
            data, hora, caminho pedido e identificação do navegador. A sessão é
            guardada no armazenamento local do teu navegador.
          </P>
        </Seccao>

        <Seccao titulo="3. Para que são usados">
          <P>
            Para gerir o ciclo de crédito — pedido, aprovação, desembolso e
            cobrança —, para comunicar contigo sobre o teu crédito, para cumprir
            as obrigações de registo e auditoria da financeira, e para garantir
            a segurança da plataforma.
          </P>
          <P>
            Os dados <strong>não são usados para publicidade, não são vendidos,
            e não são partilhados</strong> com terceiros para além dos
            necessários ao funcionamento do serviço, listados abaixo.
          </P>
        </Seccao>

        <Seccao titulo="4. Com quem são partilhados">
          <P>
            <strong>Hetzner Online GmbH</strong> aloja a plataforma, em
            Helsínquia, Finlândia. Os dados são por isso tratados fora de
            Moçambique, na União Europeia.
          </P>
          <P>
            <strong>Resend</strong> envia os emails de notificação, verificação
            de conta e reposição de palavra-passe, recebendo o endereço de email
            e o conteúdo da mensagem.
          </P>
          <P>
            <strong>Africa&apos;s Talking</strong> envia mensagens SMS de aviso,
            recebendo o número de telefone e o conteúdo da mensagem.
          </P>
          <P>
            Os tipos de letra e todos os restantes recursos da página são
            servidos a partir do nosso próprio domínio. Nenhum terceiro recebe o
            teu endereço IP por visitares este site.
          </P>
        </Seccao>

        <Seccao titulo="5. Durante quanto tempo">
          <P>{DADOS_EMPRESA.retencao}</P>
        </Seccao>

        <Seccao titulo="6. Os teus direitos">
          <P>
            Podes pedir confirmação de que existem dados teus e aceder-lhes,
            corrigir dados errados ou incompletos, pedir a eliminação quando não
            exista obrigação legal de os conservar, opor-te a tratamentos
            específicos, e obter uma cópia em formato legível.
          </P>
          <P>
            O pedido faz-se <strong>à financeira com quem tens o crédito</strong>.
            Se és mutuário, o portal permite-te consultar a qualquer momento os
            teus dados e os teus créditos. A resposta é dada em{" "}
            {DADOS_EMPRESA.prazoResposta}.
          </P>
        </Seccao>

        <Seccao titulo="7. Segurança">
          <P>
            Comunicação cifrada em trânsito, palavras-passe guardadas apenas em
            forma cifrada irreversível, sessões de curta duração, isolamento
            entre financeiras imposto no servidor, controlo de acesso por perfil,
            validação do conteúdo dos ficheiros carregados, registo de auditoria,
            e testes automáticos que verificam estas barreiras a cada alteração
            do sistema.
          </P>
          <P>
            Nenhum sistema é inviolável. Em caso de violação de dados, a
            financeira afetada é notificada.
          </P>
        </Seccao>

        <Seccao titulo="8. Enquadramento legal">
          <P>
            Moçambique não tem, à data desta publicação, lei de proteção de
            dados pessoais em vigor. Esta política foi escrita para antecipar a
            legislação em preparação, alinhada com a Convenção da União Africana
            sobre Cibersegurança e Proteção de Dados Pessoais.
          </P>
        </Seccao>

        <Divider sx={{ my: 4 }} />

        <Link component={RouterLink} to="/landing-page" underline="hover">
          Voltar ao início
        </Link>
      </Container>
    </Box>
  );
}
