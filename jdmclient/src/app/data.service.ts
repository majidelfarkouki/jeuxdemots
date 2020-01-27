import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';


@Injectable()
export class DataService {

  result_load: any;
  result_definitions: any;
  result_incomings: any;
  result_outgoings: any;

  suggestions: any;

  constructor(private _http: Http) { }

  loadTerm(term) {
    let search;
    if (term.word) {
      search = term.word;
    } else {
      search = term;
    }
    return this._http.get(environment.server_host_name + 'loadTerm/' + search)
      .pipe(map(result => this.result_load = result.json().data));
  }

  getDefinitions(term) {
    let search;
    if (term.word) {
      search = term.word;
    } else {
      search = term;
    }
    return this._http.get(environment.server_host_name + 'getDefinitions/' + search)
      .pipe(map(result_definitions => this.result_definitions = result_definitions.json()));
  }

  getIncomings(term) {
    console.log(term);
    let search;
    if (term.word) {
      search = term.word;
    } else {
      search = term;
    }
    return this._http.get(environment.server_host_name + 'getIncomings/' + search)
      .pipe(map(result_incomings => this.result_incomings = result_incomings.json()));
  }

  getOutgoings(term) {
    let search;
    if (term.word) {
      search = term.word;
    } else {
      search = term;
    }
    return this._http.get(environment.server_host_name + 'getOutgoings/' + search)
      .pipe(map(result_outgoings => this.result_outgoings = result_outgoings.json()));
  }

  getCompletion(term: string) {
    return this._http.get(environment.server_host_name + 'auto-compl/' + term)
      .pipe(map(result_suggestions => this.suggestions = result_suggestions.json()));
  }
}