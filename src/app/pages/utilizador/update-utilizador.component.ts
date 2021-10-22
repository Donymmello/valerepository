import { AuthService } from './../services/auth.service';

import { Utilizador } from '../../utilizador';
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-update-utilizador',
    templateUrl: './update-utilizador.component.html',
    styleUrls: ['./update-utilizador.component.scss']
  })
  export class UpdateUtilizadorComponent implements OnInit {
    
    id: number;
    utilizador: Utilizador = new Utilizador();
    constructor(private authService: AuthService,
      private route: ActivatedRoute,
      private router: Router) { }
  
    ngOnInit(): void {
      this.id = this.route.snapshot.params['id'];
  
      this.authService.getUtilizadorById(this.id).subscribe(data => {
        this.utilizador = data;
      }, error => console.log(error));
    }
  
    onSubmit(){
      this.authService.updateUtilizador(this.id, this.utilizador).subscribe( data =>{
        this.goToUtilizadorList();
      }
      , error => console.log(error));
    }
  
    goToUtilizadorList(){
      this.router.navigate(['/utilizador-list']);
    }
  }