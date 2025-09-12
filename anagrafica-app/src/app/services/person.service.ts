import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Person, PersonSummary, Address, Contact } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private personsSubject = new BehaviorSubject<Person[]>(this.getMockData());
  public persons$ = this.personsSubject.asObservable();
  private nextId = 4;

  constructor() { }

  // Ottieni tutte le persone
  getPersons(): Observable<Person[]> {
    return this.persons$;
  }

  // Ottieni sommario delle persone per la lista
  getPersonsSummary(): Observable<PersonSummary[]> {
    const summaries = this.personsSubject.value.map(person => ({
      id: person.id!,
      firstName: person.firstName,
      lastName: person.lastName,
      primaryEmail: person.contacts.find(c => c.type === 'email' && c.isPrimary)?.value,
      primaryPhone: person.contacts.find(c => c.type === 'phone' && c.isPrimary)?.value
    }));
    return of(summaries);
  }

  // Ottieni una persona per ID
  getPersonById(id: number): Observable<Person | undefined> {
    const person = this.personsSubject.value.find(p => p.id === id);
    return of(person);
  }

  // Aggiungi una nuova persona
  addPerson(person: Person): Observable<Person> {
    const newPerson = { ...person, id: this.nextId++, createdAt: new Date(), updatedAt: new Date() };
    const currentPersons = this.personsSubject.value;
    this.personsSubject.next([...currentPersons, newPerson]);
    return of(newPerson);
  }

  // Aggiorna una persona esistente
  updatePerson(id: number, person: Person): Observable<Person | null> {
    const currentPersons = this.personsSubject.value;
    const index = currentPersons.findIndex(p => p.id === id);
    
    if (index !== -1) {
      const updatedPerson = { ...person, id, updatedAt: new Date() };
      currentPersons[index] = updatedPerson;
      this.personsSubject.next([...currentPersons]);
      return of(updatedPerson);
    }
    
    return of(null);
  }

  // Elimina una persona
  deletePerson(id: number): Observable<boolean> {
    const currentPersons = this.personsSubject.value;
    const filteredPersons = currentPersons.filter(p => p.id !== id);
    
    if (filteredPersons.length < currentPersons.length) {
      this.personsSubject.next(filteredPersons);
      return of(true);
    }
    
    return of(false);
  }

  // Dati mock per il testing
  private getMockData(): Person[] {
    return [
      {
        id: 1,
        firstName: 'Mario',
        lastName: 'Rossi',
        dateOfBirth: new Date('1985-03-15'),
        fiscalCode: 'RSSMRA85C15H501Z',
        gender: 'M',
        profession: 'Ingegnere',
        notes: 'Cliente di lunga data',
        addresses: [
          {
            id: 1,
            street: 'Via Roma 123',
            city: 'Milano',
            postalCode: '20100',
            province: 'MI',
            country: 'Italia',
            type: 'home'
          }
        ],
        contacts: [
          {
            id: 1,
            type: 'email',
            value: 'mario.rossi@email.com',
            label: 'Email personale',
            isPrimary: true
          },
          {
            id: 2,
            type: 'phone',
            value: '+39 02 1234567',
            label: 'Telefono casa',
            isPrimary: true
          }
        ],
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-15')
      },
      {
        id: 2,
        firstName: 'Giulia',
        lastName: 'Bianchi',
        dateOfBirth: new Date('1990-07-22'),
        fiscalCode: 'BNCGLI90L62F205X',
        gender: 'F',
        profession: 'Avvocato',
        addresses: [
          {
            id: 2,
            street: 'Corso Venezia 45',
            city: 'Milano',
            postalCode: '20121',
            province: 'MI',
            country: 'Italia',
            type: 'work'
          }
        ],
        contacts: [
          {
            id: 3,
            type: 'email',
            value: 'giulia.bianchi@studio.it',
            label: 'Email lavoro',
            isPrimary: true
          },
          {
            id: 4,
            type: 'mobile',
            value: '+39 333 1234567',
            label: 'Cellulare',
            isPrimary: true
          }
        ],
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date('2023-02-10')
      },
      {
        id: 3,
        firstName: 'Luca',
        lastName: 'Verdi',
        dateOfBirth: new Date('1978-11-08'),
        fiscalCode: 'VRDLCU78S08L219Y',
        gender: 'M',
        profession: 'Medico',
        addresses: [
          {
            id: 3,
            street: 'Via Garibaldi 78',
            city: 'Roma',
            postalCode: '00100',
            province: 'RM',
            country: 'Italia',
            type: 'home'
          }
        ],
        contacts: [
          {
            id: 5,
            type: 'email',
            value: 'luca.verdi@ospedale.it',
            label: 'Email professionale',
            isPrimary: true
          },
          {
            id: 6,
            type: 'phone',
            value: '+39 06 9876543',
            label: 'Telefono studio',
            isPrimary: true
          }
        ],
        createdAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-05')
      }
    ];
  }
}