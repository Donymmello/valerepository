import { ConsultaComponent } from './pages/consulta/consulta.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { AuthenticationGuard } from './guard/authentication.guard';
import { AuthenticationService } from './services/authentication.service';
import { UserService } from './services/user.service';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { NotificationModule } from './notification.module';

import { RegisterComponent } from './pages/register/register.component';
import { UserComponent } from './pages/user/user.component';
import { LoginComponent } from './pages/login/login.component';
import { PagamentoComponent } from './pages/pagamento/pagamento.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { LoanComponent } from './pages/loan/loan.component';
import { BrowserModule } from '@angular/platform-browser';


@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    NotificationModule,
    AppRoutingModule
    
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    LoginComponent,
    RegisterComponent,
    UserComponent,
    //ResetPasswordComponent,
    PagamentoComponent,
    UserProfileComponent,
    ConsultaComponent,
    LoanComponent
  

  ],
  providers: [AuthenticationGuard, AuthenticationService, UserService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
