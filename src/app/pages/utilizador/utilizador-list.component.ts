
import { Utilizador } from '../../utilizador';
import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
    selector: 'app-utilizador-list',
    templateUrl: './utilizador-list.component.html',
    styleUrls: ['./utilizador-list.component.scss']
  })
  export class UtilizadorListComponent implements OnInit {
  
      utilizadores: Utilizador[];
  
      constructor(private authService: AuthService, 
        private router: Router) { }
      
      ngOnInit(): void {
        this.getUtilizadores();
      }
    
      private getUtilizadores(){
        this.authService.getUtilizadoresList().subscribe(data => {
          this.utilizadores = data;
        });
      }
      utilizadorDetails(id: any){
        console.log('Teste');
        
        console.log(id);
        
        this.router.navigate(['utilizador-details', id]);
      }
    
      updateUtilizador(id: number){
        this.router.navigate(['update-utilizador', id]);
      }
    
      deleteUtilizador(id: number){
        this.authService.deleteUtilizador(id).subscribe( data => {
          console.log(data);
          this.getUtilizadores();
        })
      }
    }
  