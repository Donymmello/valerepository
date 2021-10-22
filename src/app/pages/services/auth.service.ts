import { Utilizador } from './../../utilizador';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseURL = "http://localhost:8080/api/utilizadores";

  constructor(private httpClient: HttpClient) { }

  getUtilizadoresList(): Observable<Utilizador[]> {
    return this.httpClient.get<Utilizador[]>(`${this.baseURL}`);
  }
  register(utilizador: Utilizador): Observable<Object> {
    return this.httpClient.post(`${this.baseURL}`, utilizador);
  }

  getUtilizadorById(id: number): Observable<Utilizador> {
    return this.httpClient.get<Utilizador>(`${this.baseURL}/${id}`);
  }

  updateUtilizador(id: number, utilizador: Utilizador): Observable<Object> {
    return this.httpClient.put(`${this.baseURL}/${id}`, utilizador);
  }

  deleteUtilizador(id: number): Observable<Object> {
    return this.httpClient.delete(`${this.baseURL}/${id}`);
  }
}
