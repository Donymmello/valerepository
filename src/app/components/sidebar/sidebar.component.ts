import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: '/home', title: 'Início', icon: 'ni-tv-2 text-black', class: '' },
  { path: '/consulta', title: 'Consultar saldo', icon: 'ni ni-collection text-black', class: '' },
  { path: '/emprestimo', title: 'Pedir emprestimo', icon: 'ni ni-chart-bar-32 text-black', class: '' },
  { path: '/pagamento', title: 'Pagamentos', icon: 'ni ni-ruler-pencil text-black', class: '' },
  {path: '/login', title: 'Login',  icon:'ni ni-key-25 text-black', class: '' },
  {path: '/register', title: 'Register',  icon:'ni ni-circle-08 text-black', class: '' },
  // {path: '#', title:'Reembolsos', icon: 'ni ni-check-bold text-black',class: ''},
  // { path: '/user-profile', title: 'User profile',  icon:'ni-single-02 text-yellow', class: '' },
  // { path: '/tables', title: 'Tables',  icon:'ni-bullet-list-67 text-red', class: '' },
  // { path: '/icons', title: 'Icons',  icon:'ni-planet text-blue', class: '' },
  // { path: '/maps', title: 'Maps',  icon:'ni-pin-3 text-orange', class: '' },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public isCollapsed = true;

  constructor(private router: Router) { }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });
  }
}
