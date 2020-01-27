import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit {

  load: Array<any>;
  definitions: Array<any>;
  incomings: Array<any>;
  outgoings: Array<any>;

  incomingsTypes: Array<any>;
  outgoingsTypes: Array<any>;
  selectedIncomings: Array<any>;
  selectedOutgoings: Array<any>;

  filteredTermsSuggestions: Array<any>;

  error: any;
  msgs: any;

  term: any;
  real_term: string;

  visibility = false;
  loading_visibility = false;
  error_visibility = false;
  empty_incomings = false;
  empty_outgoings = false;
  isShownIncomings: boolean = true ;
  isShownOutgoings: boolean = true;
  
  constructor(private _dataService: DataService) { }

  ngOnInit() {
  }


  gets() {
    console.log('In gets() for term ' + this.term);
    if (this.term.word) {
      this.real_term = this.term.word;
    } else {
      this.real_term = this.term;
    }
    const term_searched = this.real_term;
    this.visibility = true;
    this.loading_visibility = false;

    this._dataService.getDefinitions(term_searched).subscribe(res_def => { console.log(res_def); this.definitions = res_def; });
    this._dataService.getIncomings(term_searched).subscribe(res_in => {
      if (res_in[0].term === 'Aucune relation entrante') {
        this.empty_incomings = true;
      } else {
        this.empty_incomings = false;
      }
      this.incomings = res_in;
      this.selectedIncomings = res_in;
      this.populateIncomingsTypes();
    });
    this._dataService.getOutgoings(term_searched).subscribe(res_out => {
      if (res_out[0].term === 'Aucune relation sortante') {
        this.empty_outgoings = true;
      } else {
        this.empty_outgoings = false;
      }
      this.outgoings = res_out;
      this.selectedOutgoings = res_out;
      this.populateOutgoingsTypes();
    });
  }

  search() {
    const term_searched = this.term;
    this.visibility = false;
    this.loading_visibility = true;
    console.log(this.term);
    this._dataService.loadTerm(term_searched).subscribe(res => {
      console.log(res);
      if (res[0].status === 'done') {
        this.gets();
      } else if (res[0].status === 'error') {
        this.error = res[0];
        this.loading_visibility = false;
        this.showError();
      }
    });
  }

  incomingsclick(){
    this.isShownIncomings = ! this.isShownIncomings;
  }

  outgoingsclick(){
    this.isShownOutgoings = ! this.isShownOutgoings;
  }

  search_link(event) {
    this.term = event.data.term;
    const term_searched = event.data.term;
    this.visibility = false;
    this.loading_visibility = true;
    console.log(this.term);
    this._dataService.loadTerm(term_searched).subscribe(res => {
      console.log(res);
      if (res[0].status === 'done') {
        console.log('Call gets()');
        this.gets();
      } else if (res[0].status === 'error') {
        this.error = res[0];
        this.loading_visibility = false;
        this.showError();
      }
    });
  }

  filterTermSuggestion(event) {
    this._dataService.getCompletion(this.term).subscribe(res => this.filteredTermsSuggestions = res);
  }

  changeSortIncomings(event) {
    if (event.field === 'term') {
      this.selectedIncomings.sort((val_1, val_2) => {
        if (event.order) {
          if (val_1[event.field].toLowerCase().localeCompare(val_2[event.field].toLowerCase(), 'fr') > 0) {
            return -1;
          } else {
            return 1;
          }
        } else {
          if (val_1[event.field].toLowerCase().localeCompare(val_2[event.field].toLowerCase(), 'fr') > 0) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    } else if (event.field === 'weight') {
      this.selectedIncomings.sort((val_1, val_2) => {
        val_1 = parseInt(val_1[event.field], 10);
        val_2 = parseInt(val_2[event.field], 10);

        if (event.order) {
          if (val_1 > val_2) {
            return -1;
          } else {
            return 1;
          }
        } else {
          if (val_1 > val_2) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    }
  }

  changeSortOutgoings(event) {
    if (event.field === 'term') {
      this.selectedOutgoings.sort((val_1, val_2) => {
        if (event.order) {
          if (val_1[event.field].toLowerCase().localeCompare(val_2[event.field].toLowerCase(), 'fr') > 0) {
            return -1;
          } else {
            return 1;
          }
        } else {
          if (val_1[event.field].toLowerCase().localeCompare(val_2[event.field].toLowerCase(), 'fr') > 0) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    } else if (event.field === 'weight') {
      this.selectedOutgoings.sort((val_1, val_2) => {
        val_1 = parseInt(val_1[event.field], 10);
        val_2 = parseInt(val_2[event.field], 10);

        if (event.order) {
          if (val_1 > val_2) {
            return -1;
          } else {
            return 1;
          }
        } else {
          if (val_1 > val_2) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    }
  }

  populateIncomingsTypes() {
    let lookup = {};
    this.incomingsTypes = [{ label: 'Tous les types', value: null }];
    this.incomings.forEach((value, index) => {
      if (!lookup[value.type]) {
        lookup[value.type] = 1;
        this.incomingsTypes.push({ label: value.type, value: value.type });
      }
    });
  }

  populateOutgoingsTypes() {
    let lookup = {};
    this.outgoingsTypes = [{ label: 'Tous les types', value: null }];
    this.outgoings.forEach((value, index) => {
      if (!lookup[value.type]) {
        lookup[value.type] = 1;
        this.outgoingsTypes.push({ label: value.type, value: value.type });
      }
    });
  }

  typeIncomingsFilter(value) {
    if (value) {
      let typeSelected = value;
      this.selectedIncomings = this.incomings.filter(function (incoming) {
        return incoming.type === typeSelected;
      });
    } else {
      this.selectedIncomings = this.incomings;
    }
  }

  typeOutgoingsFilter(value) {
    if (value) {
      let typeSelected = value;
      this.selectedOutgoings = this.outgoings.filter(function (outgoing) {
        return outgoing.type === typeSelected;
      });
    } else {
      this.selectedOutgoings = this.outgoings;
    }
  }

  showError() {
    this.msgs = [];
    this.msgs.push({ severity: 'error', summary: 'Message d\'erreur', detail: this.error.data });
  }
}