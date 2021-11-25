import { RegisterComponent } from './../../pages/register/register.component';
import { PagamentoComponent } from './../../pages/pagamento/pagamento.component';
import { UserProfileComponent } from './../../pages/user-profile/user-profile.component';
import { ConsultaComponent } from './../../pages/consulta/consulta.component';
import { LoanComponent } from '../../pages/loan/loan.component';
import { HomeComponent } from './../../pages/ home/home.component';
import { Routes } from '@angular/router';

export const AdminLayoutRoutes: Routes = [
    { path: 'home', component: HomeComponent },
];
