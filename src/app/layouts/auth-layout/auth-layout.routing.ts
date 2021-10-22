import { UtilizadorDetailsComponent } from 'src/app/pages/utilizador/utilizador-details.component';
import { UpdateUtilizadorComponent } from 'src/app/pages/utilizador/update-utilizador.component';
import { ResetPasswordComponent } from './../../pages/reset-password/reset-password.component';
import { Routes } from '@angular/router';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';

export const AuthLayoutRoutes: Routes = [
    { path: 'login',          component: LoginComponent },
    { path: 'reset-password',       component: ResetPasswordComponent },
    { path: 'register',       component: RegisterComponent },
    { path: '', redirectTo: '/login ', pathMatch: 'full'},
    
];
