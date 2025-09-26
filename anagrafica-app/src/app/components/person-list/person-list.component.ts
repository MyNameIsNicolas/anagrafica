import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PersonService } from '../../services';
import { Person } from '../../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.css']
})
export class PersonListComponent implements OnInit, OnDestroy {
  persons: Person[] = [];
  filteredPersons: Person[] = [];
  searchTerm: string = '';
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'phone', 'status', 'actions'];
  private personsSubscription?: Subscription;

  constructor(
    private personService: PersonService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPersons();
  }

  ngOnDestroy(): void {
    if (this.personsSubscription) {
      this.personsSubscription.unsubscribe();
    }
  }

  loadPersons(): void {
    // Unsubscribe dalla subscription precedente se esiste
    if (this.personsSubscription) {
      this.personsSubscription.unsubscribe();
    }
    
    console.log('Caricamento persone...');
    
    // Sottoscrivi all'observable delle persone che si aggiorna automaticamente
    this.personsSubscription = this.personService.getPersons().subscribe({
      next: (persons) => {
        console.log(`Ricevute ${persons.length} persone dal servizio`);
        this.persons = persons;
        this.applyCurrentFilter();
      },
      error: (error) => {
        console.error('Errore nel caricamento delle persone:', error);
        this.snackBar.open('Errore nel caricamento delle persone', 'Chiudi', {
          duration: 3000
        });
      }
    });
  }

  private applyCurrentFilter(): void {
    if (this.searchTerm.trim()) {
      this.filterPersons();
    } else {
      this.filteredPersons = this.persons;
    }
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
    // Previeni click multipli
    if (!person || !person.id) {
      console.error('Persona non valida per l\'eliminazione:', person);
      this.snackBar.open('Errore: dati persona non validi', 'Chiudi', {
        duration: 3000
      });
      return;
    }

    const confirmMessage = `Sei sicuro di voler eliminare ${person.firstName} ${person.lastName}?`;
    
    // Usa setTimeout per evitare il blocking del thread UI
    setTimeout(() => {
      if (confirm(confirmMessage)) {
        console.log(`Tentativo di eliminazione persona ID: ${person.id}`);
        
        this.personService.deletePerson(person.id!).subscribe({
          next: (success) => {
            console.log(`Risultato eliminazione: ${success}`);
            if (success) {
              this.snackBar.open('Persona eliminata con successo', 'Chiudi', {
                duration: 3000
              });
            } else {
              this.snackBar.open('Persona non trovata o già eliminata', 'Chiudi', {
                duration: 3000
              });
            }
          },
          error: (error) => {
            console.error('Errore durante l\'eliminazione:', error);
            this.snackBar.open('Errore durante l\'eliminazione', 'Chiudi', {
              duration: 3000
            });
          }
        });
      }
    }, 0);
  }

  viewDocuments(person: Person): void {
    this.router.navigate(['/persons', person.id, 'documents']);
  }

  viewRelationships(person: Person): void {
    this.router.navigate(['/persons', person.id, 'relationships']);
  }

  toggleActiveStatus(person: Person): void {
    const updatedPerson = { ...person, isActive: !person.isActive };
    this.personService.updatePerson(updatedPerson.id!, updatedPerson).subscribe({
      next: (result) => {
        if (result) {
          this.snackBar.open(`Stato ${updatedPerson.isActive ? 'attivato' : 'disattivato'} per ${person.firstName} ${person.lastName}`, 'Chiudi', {
            duration: 3000
          });
          // Non serve ricaricare manualmente, l'observable si aggiorna automaticamente
        } else {
          this.snackBar.open('Errore durante l\'aggiornamento dello stato', 'Chiudi', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Errore durante l\'aggiornamento dello stato', 'Chiudi', {
          duration: 3000
        });
      }
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
