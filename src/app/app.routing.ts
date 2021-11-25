import { LoanComponent } from './pages/loan/loan.component';

import { PagamentoComponent } from './pages/pagamento/pagamento.component';
import { ConsultaComponent } from './pages/consulta/consulta.component';
import { RegisterComponent } from './pages/register/register.component';
import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginComponent } from "./pages/login/login.component";
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserComponent } from './pages/user/user.component';
import { AuthenticationGuard } from './guard/authentication.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '', component: AdminLayoutComponent, children: [
      { path: '', loadChildren: () => import('src/app/layouts/admin-layout/admin-layout.module').then(m => m.AdminLayoutModule) }
    ]
  },
  { path: 'register', component: RegisterComponent },
  //{ path: 'user/management', component: UserComponent, canActivate: [AuthenticationGuard] },

  { path: 'user-profile', component: UserProfileComponent },
  { path: 'emprestimo', component: LoanComponent },
  { path: 'consulta', component: ConsultaComponent },
  { path: 'pagamento', component: PagamentoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],//CommonModule,//BrowserModule,],
  exports: [RouterModule]
})
export class AppRoutingModule { }
