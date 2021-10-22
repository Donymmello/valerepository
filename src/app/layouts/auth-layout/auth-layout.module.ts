import { UtilizadorListComponent } from './../../pages/utilizador/utilizador-list.component';
import { ResetPasswordComponent } from './../../pages/reset-password/reset-password.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import { UpdateUtilizadorComponent } from 'src/app/pages/utilizador/update-utilizador.component';
import { UtilizadorDetailsComponent } from 'src/app/pages/utilizador/utilizador-details.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule
    // NgbModule
  ],
  declarations: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,

    UtilizadorListComponent,
    UpdateUtilizadorComponent,
    UtilizadorDetailsComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,

    UpdateUtilizadorComponent,
    UtilizadorDetailsComponent,
    
  ]
})
export class AuthLayoutModule { }
