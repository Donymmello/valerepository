import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagamento } from '../model/pagamento';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {
  
  private host = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public addPagamento(formData: FormData): Observable<Pagamento | HttpErrorResponse> {
    return this.http.post<Pagamento>(`${this.host}/payment/add`, formData);
  }
  createPagamentoFormDate(arg0: null, value: any) formDate {
    const formData = new FormData();
    formData.append('username', pagamento.username);
    formData.append('valor', pagamento.valor);
    formData.append('valor', pagamento.nuit);
    formData.append('taxa', pagamento.taxa);;
    return formData;
  }
}
