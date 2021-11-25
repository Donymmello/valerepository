import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Loan } from '../model/loan';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  private host = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createLoan(loan: Loan): Observable<Object>{
    return this.http.post<Loan>(`${this.host}/loan/create`, loan);
    //return this.http.post<User>(`${this.host}/user/add`, formData);
  }
}
