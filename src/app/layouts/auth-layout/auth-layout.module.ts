
import { ResetPasswordComponent } from './../../pages/reset-password/reset-password.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import { UserComponent } from 'src/app/pages/utilizador/user.component';
import { NotificationModule } from 'src/app/notification.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule,
    HttpClientModule,
    NotificationModule
    // NgbModule
  ],
  declarations: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,
    UserComponent
  ],
  exports: [
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,

  ]
})
export class AuthLayoutModule { }
