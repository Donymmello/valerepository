import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { NOME_PLATAFORMA, NOME_EMPRESA, CONTACTOS } from "../../theme";

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
  // O endereço geral serve até existir um dedicado à privacidade; não
  // vale a pena anunciar uma caixa que ninguém lê. Ver CONTACTOS em
  // theme.js, que é onde isto se muda.
  emailPrivacidade: CONTACTOS.email,
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
            A financeira com quem tens o crédito é a responsável pelo
            tratamento. É ela que decide recolher os teus dados, para que fim e
            durante quanto tempo. A {NOME_EMPRESA} é subcontratante: fornece a
            plataforma e trata os dados por instrução dessa financeira.
          </P>
          <P>
            Os pedidos sobre os teus dados fazem-se à financeira, não a nós.
            Para assuntos sobre a plataforma em si, escreve para{" "}
            {DADOS_EMPRESA.emailPrivacidade}.
          </P>
        </Seccao>

        <Seccao titulo="2. Que dados são tratados">
          <P>
            Sobre o mutuário, guardamos o nome completo, o tipo e número do
            documento de identificação, o NUIT, a data de nascimento, o
            telefone, o email e a morada, com província e distrito.
          </P>
          <P>
            Sobre o crédito, guardamos os pedidos que fizeste, os valores e a
            finalidade, os créditos ativos, o plano de parcelas, os pagamentos
            já efetuados e os atrasos, incluindo situações de incumprimento.
          </P>
          <P>
            Guardamos ainda os ficheiros que carregas: os documentos exigidos
            como requisito do pedido, normalmente o documento de identificação,
            o comprovativo de rendimento e o comprovativo de morada, e os
            comprovativos de pagamento que envias depois.
          </P>
          <P>
            Dos utilizadores da financeira guardamos o nome, o email e o perfil
            de acesso. A palavra-passe fica cifrada de forma irreversível e
            nunca é guardada em texto legível.
          </P>
          <P>
            O sistema regista também quem executou cada ação sensível, sobre que
            registo e quando. Esse histórico serve para auditoria e para apurar
            responsabilidade.
          </P>
          <P>
            Por fim, o servidor regista o endereço IP, a data, a hora, o caminho
            pedido e a identificação do navegador, como qualquer servidor web. A
            tua sessão fica guardada no armazenamento local do navegador.
          </P>
        </Seccao>

        <Seccao titulo="3. Para que são usados">
          <P>
            Para gerir o ciclo de crédito, desde o pedido até à cobrança,
            passando pela aprovação e pelo desembolso. Para te comunicar
            decisões e avisos sobre o teu crédito. E para cumprir as obrigações
            de registo e auditoria a que a financeira está sujeita.
          </P>
          <P>
            Os teus dados não são usados para publicidade nem vendidos a
            ninguém. Só são partilhados com os fornecedores necessários ao
            funcionamento do serviço, que estão listados abaixo.
          </P>
        </Seccao>

        <Seccao titulo="4. Com quem são partilhados">
          <P>
            A plataforma está alojada na Hetzner Online GmbH, em Helsínquia, na
            Finlândia. Os teus dados são por isso tratados fora de Moçambique,
            na União Europeia.
          </P>
          <P>
            A Resend envia os emails de notificação, de verificação de conta e
            de reposição de palavra-passe. Recebe o teu endereço de email e o
            conteúdo da mensagem.
          </P>
          <P>
            A Africa&apos;s Talking envia as mensagens SMS de aviso. Recebe o
            teu número de telefone e o conteúdo da mensagem.
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
            Podes saber que dados teus existem e aceder-lhes. Podes corrigir o
            que estiver errado ou incompleto. Podes pedir que sejam apagados,
            desde que não haja obrigação legal de os conservar. Podes opor-te a
            tratamentos concretos e pedir uma cópia em formato legível.
          </P>
          <P>
            O pedido faz-se à financeira com quem tens o crédito, que responde
            em {DADOS_EMPRESA.prazoResposta}. Se és mutuário, o portal
            permite-te consultar os teus dados e os teus créditos a qualquer
            momento, sem pedir nada a ninguém.
          </P>
        </Seccao>

        <Seccao titulo="7. Segurança">
          <P>
            A comunicação é cifrada em trânsito e as palavras-passe são
            guardadas de forma irreversível. As sessões duram pouco tempo e
            renovam-se. Cada financeira só acede aos seus próprios dados, e essa
            separação é imposta no servidor, não na interface.
          </P>
          <P>
            Dentro de cada financeira, o acesso depende do perfil de cada
            utilizador. Os ficheiros carregados são validados pelo conteúdo e
            não apenas pela extensão. As ações sensíveis ficam registadas. E há
            testes automáticos que verificam estas barreiras sempre que o
            sistema é alterado.
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
