import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PersonService } from '../../services';
import { Person } from '../../models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.css']
})
export class PersonListComponent implements OnInit {
  persons: Person[] = [];
  filteredPersons: Person[] = [];
  searchTerm: string = '';
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'phone', 'status', 'actions'];

  constructor(
    private personService: PersonService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPersons();
  }

  loadPersons(): void {
    this.personService.getPersons().subscribe({
      next: (persons) => {
        this.persons = persons;
        this.filteredPersons = persons;
      },
      error: (error) => {
        this.snackBar.open('Errore nel caricamento delle persone', 'Chiudi', {
          duration: 3000
        });
      }
    });
  }

  viewPerson(id: number): void {
    this.router.navigate(['/persons', id]);
  }

  editPerson(id: number): void {
    this.router.navigate(['/persons', id, 'edit']);
  }

  addPerson(): void {
    this.router.navigate(['/persons/new']);
  }

  deletePerson(person: Person): void {
    if (confirm(`Sei sicuro di voler eliminare ${person.firstName} ${person.lastName}?`)) {
      this.personService.deletePerson(person.id!).subscribe(() => {
        console.log('Persona eliminata con successo');
      });
    }
  }

  viewDocuments(person: Person): void {
    this.router.navigate(['/persons', person.id, 'documents']);
  }

  viewRelationships(person: Person): void {
    this.router.navigate(['/persons', person.id, 'relationships']);
  }

  toggleActiveStatus(person: Person): void {
    const updatedPerson = { ...person, isActive: !person.isActive };
    this.personService.updatePerson(updatedPerson.id!, updatedPerson).subscribe(() => {
      console.log(`Stato ${updatedPerson.isActive ? 'attivato' : 'disattivato'} per ${person.firstName} ${person.lastName}`);
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.filterPersons();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredPersons = this.persons;
  }

  private filterPersons(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPersons = this.persons;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredPersons = this.persons.filter(person => {
      // Ricerca per nome e cognome
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      if (fullName.includes(searchLower)) {
        return true;
      }

      // Ricerca per email
      const email = this.getPersonEmail(person);
      if (email && email.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Ricerca per telefono
      const phone = this.getPersonPhone(person);
      if (phone && phone.includes(searchLower)) {
        return true;
      }

      return false;
    });
  }

  getPersonEmail(person: Person): string | null {
    const emailContact = person.contacts.find(c => c.type === 'email');
    return emailContact ? emailContact.value : null;
  }

  getPersonPhone(person: Person): string | null {
    const phoneContact = person.contacts.find(c => c.type === 'phone');
    return phoneContact ? phoneContact.value : null;
  }

  hasEmail(person: Person): boolean {
    return person.contacts.some(c => c.type === 'email');
  }

  hasPhone(person: Person): boolean {
    return person.contacts.some(c => c.type === 'phone');
  }
}
