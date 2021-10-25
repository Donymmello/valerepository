import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";

type NewType = OnDestroy;

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
  })
  export class ResetPasswordComponent implements OnInit, NewType {
    constructor() {}
  
    ngOnInit() {
    }

    onSubmit(f: NgForm) {
      console.log(f.value);  // { first: '', last: '' }
      console.log(f.valid);  // false
    }
    
    ngOnDestroy() {
    }
  
  }
  