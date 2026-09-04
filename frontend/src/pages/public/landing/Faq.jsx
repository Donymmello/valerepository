import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { CORES } from "../../../theme";

const PERGUNTAS = [
  {
    pergunta: "Preciso de cartão de crédito para começar?",
    resposta: "Não. O trial de 7 dias não pede cartão, só o nome da tua financeira, o teu nome e um email.",
  },
  {
    pergunta: "Os meus dados ficam isolados de outras financeiras na plataforma?",
    resposta:
      "Sim. Cada empresa só acede aos seus próprios mutuários, pedidos e créditos. Nunca aos de outra financeira que também use o sistema.",
  },
  {
    pergunta: "Posso definir as minhas próprias taxas de juro e níveis de aprovação?",
    resposta:
      "Sim. Cada financeira configura a sua faixa de taxas e decide quem aprova em cada etapa (analista, gestor, diretor), consoante o valor e o risco do pedido.",
  },
  {
    pergunta: "Como é que os meus mutuários se registam?",
    resposta:
      "Envias-lhes o link de convite da tua empresa. Eles registam-se diretamente associados à tua financeira. Não existe um registo público genérico.",
  },
  {
    pergunta: "O que acontece quando o trial de 7 dias terminar?",
    resposta:
      "O acesso fica bloqueado até ativares um plano. Contacta-nos para continuar. Os teus dados não são apagados.",
  },
];

export default function Faq() {
  return (
    <Box id="faq" sx={{ py: { xs: 8, md: 11 }, bgcolor: CORES.fundo }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography variant="overline" sx={{ color: CORES.marca, fontWeight: 700, letterSpacing: 1.2 }}>
            FAQ
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "#0f172a" }}>
            Perguntas frequentes
          </Typography>
        </Box>

        <Box>
          {PERGUNTAS.map((item, index) => (
            <Accordion
              key={item.pergunta}
              disableGutters
              elevation={0}
              defaultExpanded={index === 0}
              sx={{
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "rgba(15,23,42,0.08)",
                borderRadius: "12px !important",
                mb: 1.5,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2.5, py: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{item.pergunta}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {item.resposta}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
