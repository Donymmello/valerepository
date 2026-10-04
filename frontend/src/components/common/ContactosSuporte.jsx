import { Stack, Link, Typography } from "@mui/material";
import { CONTACTOS } from "../../theme";

/*
  Contactos públicos, partilhados pelo rodapé da landing page, pelo fim
  das FAQ e pelo rodapé de quem está autenticado.

  Só mostra o que estiver preenchido em CONTACTOS (ver theme.js), por
  isso tirar um canal de circulação é apagá-lo lá.

  `variante` controla só a cor, porque o rodapé da landing é escuro e o
  resto da aplicação é claro. `incluirGeral` permite ao rodapé mostrar o
  endereço institucional além do de suporte; nos sítios onde quem lê já
  é utilizador do sistema, só o suporte interessa.
*/
export default function ContactosSuporte({
  variante = "claro",
  direcao = "column",
  espaco = 1,
  incluirGeral = false,
}) {
  const cor = variante === "escuro" ? "rgba(255,255,255,0.6)" : "text.secondary";

  const itens = [
    CONTACTOS.emailSuporte && {
      chave: "suporte",
      label: CONTACTOS.emailSuporte,
      href: `mailto:${CONTACTOS.emailSuporte}`,
    },
    incluirGeral &&
      CONTACTOS.email && {
        chave: "geral",
        label: CONTACTOS.email,
        href: `mailto:${CONTACTOS.email}`,
      },
    CONTACTOS.telefone && {
      chave: "telefone",
      label: CONTACTOS.telefone,
      // tel: não tolera espaços, mas o texto visível sim.
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
  peso a mais. Mostra o endereço de suporte e, se houver, o telefone.
*/
export function LinhaSuporte({ texto = "Precisas de ajuda?" }) {
  const email = CONTACTOS.emailSuporte || CONTACTOS.email;
  if (!email) return null;

  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {texto}{" "}
      <Link href={`mailto:${email}`} underline="hover">
        {email}
      </Link>
      {CONTACTOS.telefone ? (
        <>
          {" · "}
          <Link
            href={`tel:${CONTACTOS.telefone.replace(/[^\d+]/g, "")}`}
            underline="hover"
          >
            {CONTACTOS.telefone}
          </Link>
        </>
      ) : null}
    </Typography>
  );
}
