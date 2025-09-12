import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PersonService } from '../../services';
import { Person } from '../../models';

@Component({
  selector: 'app-person-detail',
  templateUrl: './person-detail.component.html',
  styleUrls: ['./person-detail.component.css']
})
export class PersonDetailComponent implements OnInit {
  person$: Observable<Person | undefined>;
  personId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService
  ) {
    this.personId = 0;
    this.person$ = new Observable();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.personId = +params['id'];
      if (this.personId) {
        this.person$ = this.personService.getPersonById(this.personId);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/persons']);
  }

  editPerson(): void {
    this.router.navigate(['/persons', this.personId, 'edit']);
  }

  deletePerson(): void {
    if (confirm('Sei sicuro di voler eliminare questa persona?')) {
      this.personService.deletePerson(this.personId).subscribe(() => {
        this.router.navigate(['/persons']);
      });
    }
  }

  getContactTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'phone': 'Telefono',
      'email': 'Email',
      'fax': 'Fax',
      'mobile': 'Cellulare',
      'other': 'Altro'
    };
    return labels[type] || type;
  }

  getAddressTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'home': 'Casa',
      'work': 'Lavoro',
      'other': 'Altro'
    };
    return labels[type] || type;
  }

  getContactIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'phone': 'phone',
      'email': 'email',
      'fax': 'fax',
      'mobile': 'smartphone',
      'other': 'contact_phone'
    };
    return icons[type] || 'contact_phone';
  }

  getAddressIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'home': 'home',
      'work': 'business',
      'other': 'location_on'
    };
    return icons[type] || 'location_on';
  }
}
