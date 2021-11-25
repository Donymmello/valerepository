import { Loan } from '../../model/loan';
import { LoanService } from '../../services/loan.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loan',
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.scss']
})
export class LoanComponent implements OnInit {

  loan: Loan = new Loan();

  constructor(private loanService: LoanService, private router: Router) { }

  ngOnInit(): void {

  }

  saveLoan(){
    this.loanService.createLoan(this.loan).subscribe( data =>{
      console.log(data);
      //this.goToEmprestimoList();
      this.router.navigate(['/home']);
    },
    error => console.log(error));
  }
    onSubmit(){
      console.log(this.loan);
    }
}
