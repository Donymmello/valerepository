import { Subscription } from 'rxjs';
import { PagamentoService } from './../../services/pagamento.service';
import { NotificationType } from './../../enum/notification-type.enum';
import { Pagamento } from '../../model/payment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-pagamento',
  templateUrl: './pagamento.component.html',
  styleUrls: ['./pagamento.component.scss']
})
export class PagamentoComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public pagamento: Pagamento;
  public pagamentos: Pagamento[];
  
  constructor(private router: Router, private pagamentoService: PagamentoService, private notificationService: NotificationService) { }
  
  ngOnInit(): void {
  }

  public onAddNewPagamento(pagamentoForm: NgForm): void {
    const formData = this.pagamentoService.createPagamentoFormDate( pagamentoForm.value);
    this.subscriptions.push(
      this.pagamentoService.addPagamento(formData).subscribe(
        (response: Pagamento) => {
          //this.clickButton('new-user-close');
          //this.getUsers(false);
          //this.fileName = null;
          //this.profileImage = null;
          //userForm.reset();
          //this.sendNotification(NotificationType.SUCCESS, `${response.nome} ${response.apelido} added successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    );
  }
  sendNotification(ERROR: NotificationType, message: any) {
    throw new Error('Method not implemented.');
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
