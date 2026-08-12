/*
  ==========================================================
  CRIAR O PRIMEIRO UTILIZADOR SUPERADMIN
  ==========================================================
  Isto é propositadamente um script de linha de comandos, não um
  endpoint HTTP: o SUPERADMIN vê e controla todas as empresas da
  plataforma, por isso não deve haver nenhuma forma de o criar
  através da API (mesma lógica do KYC: nada sensível fica aberto
  publicamente).

  Uso (dentro do container do backend):
    node scripts/createSuperAdmin.js "Nome Completo" email@dominio.com "password"

  Ou, via docker compose, a partir da tua máquina:
    docker compose exec backend node scripts/createSuperAdmin.js "Nome" email password
*/

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User } = require("../models");

async function main() {
  const [, , nome, email, password] = process.argv;

  if (!nome || !email || !password) {
    console.error("Uso: node scripts/createSuperAdmin.js \"Nome Completo\" email@dominio.com password");
    process.exitCode = 1;
    return;
  }

  if (password.length < 6) {
    console.error("A password deve ter pelo menos 6 caracteres.");
    process.exitCode = 1;
    return;
  }

  try {
    await sequelize.authenticate();

    const existente = await User.findOne({ where: { email } });
    if (existente) {
      console.error(`Já existe um utilizador com o email ${email}.`);
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const superadmin = await User.create({
      nome,
      email,
      passwordHash,
      role: "SUPERADMIN",
      empresaId: null,
      ativo: true,
    });

    console.log("SUPERADMIN criado com sucesso:");
    console.log(`  id: ${superadmin.id}`);
    console.log(`  nome: ${superadmin.nome}`);
    console.log(`  email: ${superadmin.email}`);
  } catch (error) {
    console.error("Erro ao criar SUPERADMIN:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
