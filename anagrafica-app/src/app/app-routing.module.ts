import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonListComponent } from './components/person-list/person-list.component';
import { PersonDetailComponent } from './components/person-detail/person-detail.component';
import { PersonFormComponent } from './components/person-form/person-form.component';

const routes: Routes = [
  { path: '', redirectTo: '/persons', pathMatch: 'full' },
  { path: 'persons', component: PersonListComponent },
  { path: 'persons/new', component: PersonFormComponent },
  { path: 'persons/:id', component: PersonDetailComponent },
  { path: 'persons/:id/edit', component: PersonFormComponent },
  { path: '**', redirectTo: '/persons' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
