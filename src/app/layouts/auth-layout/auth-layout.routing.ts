import { ResetPasswordComponent } from './../../pages/reset-password/reset-password.component';
import { Routes } from '@angular/router';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';

export const AuthLayoutRoutes: Routes = [
    { path: 'login',          component: LoginComponent },
    { path: 'register',       component: RegisterComponent },
    { path: '', redirectTo: '/login ', pathMatch: 'full'},
    
];
