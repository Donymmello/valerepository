import { Utilizador } from './../../utilizador';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  utilizador: Utilizador = new Utilizador();

  constructor(private authService: AuthService,
    private router: Router) { }

  ngOnInit(): void {
  }

  saveUtilizador(){
    this.authService.register(this.utilizador).subscribe( data =>{
      console.log(data);
      this.goToLogin();
    },
    error => console.log(error));
  }

  goToLogin(){
    this.router.navigate(['/login']);
  }

  onSubmit() {
    console.log(this.utilizador);  
    this.saveUtilizador(); 
  }
}
