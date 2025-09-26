import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonListComponent } from './components/person-list/person-list.component';
import { PersonDetailComponent } from './components/person-detail/person-detail.component';
import { PersonFormComponent } from './components/person-form/person-form.component';
import { DocumentManagerComponent } from './components/document-manager/document-manager.component';
import { RelationshipManagerComponent } from './components/relationship-manager/relationship-manager.component';
import { ReminderSystemComponent } from './components/reminder-system/reminder-system.component';
import { ReportsComponent } from './components/reports/reports.component';

const routes: Routes = [
  { path: '', redirectTo: '/persons', pathMatch: 'full' },
  { path: 'persons', component: PersonListComponent },
  { path: 'persons/new', component: PersonFormComponent },
  { path: 'persons/:id', component: PersonDetailComponent },
  { path: 'persons/:id/edit', component: PersonFormComponent },
  { path: 'persons/:id/documents', component: DocumentManagerComponent },
  { path: 'persons/:id/relationships', component: RelationshipManagerComponent },
  { path: 'reminders', component: ReminderSystemComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: '/persons' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
