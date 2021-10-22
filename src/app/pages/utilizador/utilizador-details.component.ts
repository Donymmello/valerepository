
import { Utilizador } from '../../utilizador';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from "@angular/core";
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-utilizador-details',
    templateUrl: './utilizador-details.component.html',
    styleUrls: ['./utilizador-details.component.scss']
  })
  export class UtilizadorDetailsComponent implements OnInit {
  
    id: number
    utilizador: Utilizador 
    constructor(private route: ActivatedRoute, private authService: AuthService) { }
  
    ngOnInit(): void {
      this.id = this.route.snapshot.params['id'];
  
      this.utilizador = new Utilizador();
      this.authService.getUtilizadorById(this.id).subscribe( data => {
        this.utilizador = data;
      });
    }
  
  }