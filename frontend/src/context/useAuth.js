import { createContext, useContext } from "react";

/*
  Separado de AuthContext.jsx de propósito: esse ficheiro exporta só o
  componente AuthProvider, e o Fast Refresh do Vite só funciona bem
  quando um ficheiro exporta só componentes (regra
  react-refresh/only-export-components). O objeto de contexto vive aqui
  — não num ficheiro de componente — para os dois lados poderem
  importá-lo sem violar essa regra.
*/
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
