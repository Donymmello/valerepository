import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagamento } from '../model/payment';

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {
  
  private host = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public addPagamento(formData: FormData): Observable<Pagamento | HttpErrorResponse> {
    return this.http.post<Pagamento>(`${this.host}/payment/add`, formData);
  }
  createPagamentoFormDate( pagamento: Pagamento): FormData {
    const formData = new FormData();
    //formData.append('',);
    //formData.append('',);
    return formData;
  }
}
