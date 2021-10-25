import { RegisterComponent } from './../../pages/register/register.component';
import { PagamentoComponent } from './../../pages/pagamento/pagamento.component';
import { UserProfileComponent } from './../../pages/user-profile/user-profile.component';
import { ConsultaComponent } from './../../pages/consulta/consulta.component';
import { EmprestimoComponent } from './../../pages/emprestimo/emprestimo.component';
import { HomeComponent } from './../../pages/ home/home.component';
import { Routes } from '@angular/router';

export const AdminLayoutRoutes: Routes = [
    { path: 'user-profile',   component: UserProfileComponent },
    { path: 'emprestimo',         component: EmprestimoComponent },
    { path: 'home',          component: HomeComponent },
    { path: 'consulta',           component: ConsultaComponent },
    { path: 'pagamento',           component: PagamentoComponent },
    
    
];
