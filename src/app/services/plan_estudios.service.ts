import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment'; 
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { RequestManager } from '../managers/requestManager';

const httpOptions = {
  headers: new HttpHeaders({
    'Accept': 'application/json',
  }),
}

const httpOptionsFile = {
  headers: new HttpHeaders({
    'Content-Type': 'multipart/form-data',
  }),
}

const path = environment.PLAN_ESTUDIOS_SERVICE;

@Injectable()
export class PlanEstudiosService {

    constructor(private requestManager: RequestManager, private http: HttpClient) {
      this.requestManager.setPath('PLAN_ESTUDIOS_SERVICE');
    }
  
    get(endpoint: any) {
      this.requestManager.setPath('PLAN_ESTUDIOS_SERVICE');
      return this.requestManager.get(endpoint);
    }
  
    post(endpoint: any, element: any) {
      this.requestManager.setPath('PLAN_ESTUDIOS_SERVICE');
      return this.requestManager.post(endpoint, element);
    }
  
    put(endpoint: any, element: { Id: any; }) {
      this.requestManager.setPath('PLAN_ESTUDIOS_SERVICE');
      return this.requestManager.put(endpoint, element);
    }
  
    delete(endpoint: any, element: { Id: any; }) {
      this.requestManager.setPath('PLAN_ESTUDIOS_SERVICE');
      return this.requestManager.delete(endpoint, element.Id);
    }
  
  }
