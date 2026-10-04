import { Stack, Link, Typography } from "@mui/material";
import { CONTACTOS } from "../../theme";

/*
  Lista de contactos de suporte, partilhada pelo rodapé da landing page,
  pelo fim das FAQ e pelo rodapé de quem está autenticado.

  Só mostra o que estiver preenchido em CONTACTOS (ver theme.js): hoje
  há email, e o telefone e o WhatsApp aparecem sozinhos no dia em que
  alguém os puser lá.

  `variante` controla só a cor, porque o rodapé da landing é escuro e o
  resto da aplicação é claro.
*/
export default function ContactosSuporte({ variante = "claro", direcao = "column", espaco = 1 }) {
  const cor = variante === "escuro" ? "rgba(255,255,255,0.6)" : "text.secondary";

  const itens = [
    CONTACTOS.email && {
      chave: "email",
      label: CONTACTOS.email,
      href: `mailto:${CONTACTOS.email}`,
    },
    CONTACTOS.telefone && {
      chave: "telefone",
      label: CONTACTOS.telefone,
      // tel: não tolera espaços nem parênteses, mas o texto visível sim.
      href: `tel:${CONTACTOS.telefone.replace(/[^\d+]/g, "")}`,
    },
    CONTACTOS.whatsapp && {
      chave: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${CONTACTOS.whatsapp}`,
      externo: true,
    },
  ].filter(Boolean);

  if (itens.length === 0) return null;

  return (
    <Stack direction={direcao} spacing={espaco}>
      {itens.map((item) => (
        <Link
          key={item.chave}
          href={item.href}
          underline="hover"
          {...(item.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          sx={{ color: cor, fontSize: "0.875rem" }}
        >
          {item.label}
        </Link>
      ))}
    </Stack>
  );
}

/*
  Uma linha só, para o fim de um ecrã onde um bloco de contactos seria
  peso a mais.
*/
export function LinhaSuporte({ texto = "Precisas de ajuda?" }) {
  if (!CONTACTOS.email) return null;

  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {texto}{" "}
      <Link href={`mailto:${CONTACTOS.email}`} underline="hover">
        {CONTACTOS.email}
      </Link>
      {CONTACTOS.telefone ? ` · ${CONTACTOS.telefone}` : ""}
    </Typography>
  );
}
