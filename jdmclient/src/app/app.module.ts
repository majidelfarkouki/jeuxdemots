import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { SearchComponent } from './search/search.component';

import { HttpModule } from '@angular/http';
import { DataService } from './data.service';

import { InputTextModule, ButtonModule, DataTableModule, DialogModule, DropdownModule, SelectButtonModule } from 'primeng/primeng';
import { TabViewModule, DataListModule, AutoCompleteModule, ProgressSpinnerModule, MultiSelectModule } from 'primeng/primeng';
import { GrowlModule } from 'primeng/primeng';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DataTableModule,
    DialogModule,
    DropdownModule,
    TabViewModule,
    DataListModule,
    AutoCompleteModule,
    ProgressSpinnerModule,
    MultiSelectModule,
    SelectButtonModule,
    GrowlModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }