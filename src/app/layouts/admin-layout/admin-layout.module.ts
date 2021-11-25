import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'; import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from 'ngx-clipboard';

import { AdminLayoutRoutes } from './admin-layout.routing';
import { PagamentoComponent } from '../../pages/pagamento/pagamento.component';
import { UserProfileComponent } from '../../pages/user-profile/user-profile.component';
import { ConsultaComponent } from '../../pages/consulta/consulta.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from 'src/app/pages/ home/home.component';


// import { ToastrModule } from 'ngx-toastr';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    HttpClientModule,
    NgbModule,
    ClipboardModule
  ],
  declarations: [
    HomeComponent
  ]
})

export class AdminLayoutModule { }
