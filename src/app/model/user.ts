export class User {
  public userId: string;
  public nome: string;
  public apelido: string;
  public nascimento: string;
  public morada: string;
  public b_i: string;
  public nuit: string;
  public tipo: string;
  public username: string;
  public email: string;
  public lastLoginDate: Date;
  public lastLoginDateDisplay: Date;
  public joinDate: Date;
  public profileImageUrl: string;
  public active: boolean;
  public notLocked: boolean;
  public role: string;
  public authorities: [];

  constructor() {
    this.userId = '';
    this.nome = '';
    this.apelido = '';
    this.nascimento = '';
    this.morada = '';
    this.b_i = '';
    this.nuit = '';
    this.tipo = '';
    this.username = '';
    this.email = '';
    this.lastLoginDate = null;
    this.lastLoginDateDisplay = null;
    this.joinDate = null;
    this.profileImageUrl = '';
    this.active = false;
    this.notLocked = false;
    this.role = '';
    this.authorities = [];
  }

}