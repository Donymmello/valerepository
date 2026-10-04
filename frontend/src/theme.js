import { createTheme } from "@mui/material/styles";

/*
  ==========================================================
  TEMA CENTRAL DA APLICAÇÃO
  ==========================================================
  Antes disto, cada página definia cores e estilos à mão
  (ex: "#1a237e" repetido em 44 sítios diferentes). Este ficheiro
  é a única fonte de verdade, para mudar o azul da marca, por
  exemplo, só é preciso mudar aqui.

  As cores abaixo foram extraídas dos valores já usados em
  produção nas páginas existentes (Login, DashboardMutuario, etc.),
  não são uma escolha nova.
*/

// Nome da marca, única fonte de verdade no frontend (ver também
// PLATFORM_NAME no backend/.env, usado nos emails e cabeçalho dos PDFs).
// Antes disto, "Sistema de Gestão de Crédito" estava escrito à mão em 8
// ficheiros diferentes, mudar de nome outra vez só precisa de mudar aqui.
export const NOME_PLATAFORMA = "Tshemba";

// Nome da empresa-mãe, dona do domínio vektramz.com. Usado no rodapé
// (copyright) e em qualquer sítio que precise da razão social, em vez
// do nome do produto.
export const NOME_EMPRESA = "Vektra Technologies MZ";

/*
  Contactos públicos, única fonte de verdade. Aparecem no rodapé da
  landing page, no fim das FAQ, no rodapé de quem está autenticado e na
  política de privacidade.

  Dois endereços de propósito: `email` é o institucional (assuntos
  comerciais, imprensa, dados pessoais) e `emailSuporte` é o de quem já
  usa o sistema e tem um problema. Separados para o suporte não ficar
  enterrado debaixo de pedidos de orçamento.

  Campos vazios não são mostrados, por isso tirar um contacto de
  circulação é apagá-lo aqui, sem tocar em JSX nenhum. O número do
  WhatsApp vai em formato internacional sem espaços nem "+", que é o que
  o wa.me aceita; o `telefone` é o texto legível e a ligação tel: é
  derivada dele.
*/
export const CONTACTOS = {
  email: "contacto@vektramz.com",
  emailSuporte: "suporte@vektramz.com",
  telefone: "+258 86 916 4456",
  whatsapp: "258869164456",
};

export const CORES = {
  marca: "#1a237e",
  sucesso: "#15803d",
  aviso: "#b45309",
  erro: "#dc2626",
  info: "#0369a1",
  roxo: "#7c3aed",
  fundo: "#f4f6f8",
};

const theme = createTheme({
  palette: {
    primary: {
      main: CORES.marca,
    },
    success: {
      main: CORES.sucesso,
    },
    warning: {
      main: CORES.aviso,
    },
    error: {
      main: CORES.erro,
    },
    info: {
      main: CORES.info,
    },
    background: {
      default: CORES.fundo,
    },
  },
  shape: {
    // Equivalente ao borderRadius:3 (unidades de 4px) já usado por convenção
    // nos Paper de quase todas as páginas, vira o default para páginas novas,
    // sem alterar o "elevation" das páginas existentes.
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      "Inter",
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Arial",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
