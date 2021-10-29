import { PagamentoComponent } from './pages/pagamento/pagamento.component';
import { ConsultaComponent } from './pages/consulta/consulta.component';
import { EmprestimoComponent } from 'src/app/pages/emprestimo/emprestimo.component';
import { RegisterComponent } from './pages/register/register.component';
import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginComponent } from "./pages/login/login.component";
import { UserProfileComponent } from './pages/user-profile/user-profile.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: '', component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('src/app/layouts/admin-layout/admin-layout.module').then(m => m.AdminLayoutModule)
      }
    ]
  }, { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login ', pathMatch: 'full' },
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'emprestimo', component: EmprestimoComponent },
  { path: 'consulta', component: ConsultaComponent },
  { path: 'pagamento', component: PagamentoComponent },
];

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes, {
      useHash: true
    })
  ],
  exports: [
  ],
})
export class AppRoutingModule { }
