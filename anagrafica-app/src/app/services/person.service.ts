import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Person, PersonSummary, Address, Contact, Document, DocumentType, PersonRelationship } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private personsSubject = new BehaviorSubject<Person[]>(this.getMockData());
  public persons$ = this.personsSubject.asObservable();
  private nextId = 4;
  private relationships: PersonRelationship[] = [];

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
    const newPerson = { 
      ...person, 
      id: this.nextId++, 
      documents: person.documents || [],
      relationships: person.relationships || [],
      isActive: person.isActive !== undefined ? person.isActive : true,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
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

  // Metodi per la gestione dei documenti
  getDocumentsByPersonId(personId: number): Observable<Document[]> {
    const person = this.personsSubject.value.find(p => p.id === personId);
    return of(person?.documents || []);
  }

  addDocumentToPerson(personId: number, document: Omit<Document, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Observable<Document> {
    const currentPersons = this.personsSubject.value;
    const personIndex = currentPersons.findIndex(p => p.id === personId);
    
    if (personIndex === -1) {
      throw new Error('Persona non trovata');
    }

    const newDocument: Document = {
      ...document,
      id: Date.now(), // Semplice generatore di ID
      personId: personId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedPersons = [...currentPersons];
    updatedPersons[personIndex] = {
      ...updatedPersons[personIndex],
      documents: [...(updatedPersons[personIndex].documents || []), newDocument],
      updatedAt: new Date()
    };

    this.personsSubject.next(updatedPersons);
    return of(newDocument);
  }

  updateDocument(personId: number, documentId: number, updates: Partial<Document>): Observable<Document> {
    const currentPersons = this.personsSubject.value;
    const personIndex = currentPersons.findIndex(p => p.id === personId);
    
    if (personIndex === -1) {
      throw new Error('Persona non trovata');
    }

    const person = currentPersons[personIndex];
    const documentIndex = person.documents?.findIndex(d => d.id === documentId) ?? -1;
    
    if (documentIndex === -1) {
      throw new Error('Documento non trovato');
    }

    const updatedPersons = [...currentPersons];
    const updatedDocuments = [...(person.documents || [])];
    updatedDocuments[documentIndex] = {
      ...updatedDocuments[documentIndex],
      ...updates,
      updatedAt: new Date()
    };

    updatedPersons[personIndex] = {
      ...person,
      documents: updatedDocuments,
      updatedAt: new Date()
    };

    this.personsSubject.next(updatedPersons);
    return of(updatedDocuments[documentIndex]);
  }

  deleteDocument(personId: number, documentId: number): Observable<boolean> {
    const currentPersons = this.personsSubject.value;
    const personIndex = currentPersons.findIndex(p => p.id === personId);
    
    if (personIndex === -1) {
      throw new Error('Persona non trovata');
    }

    const person = currentPersons[personIndex];
    const updatedDocuments = person.documents?.filter(d => d.id !== documentId) || [];

    const updatedPersons = [...currentPersons];
    updatedPersons[personIndex] = {
      ...person,
      documents: updatedDocuments,
      updatedAt: new Date()
    };

    this.personsSubject.next(updatedPersons);
    return of(true);
  }

  // Metodo per ottenere documenti in scadenza
  getExpiringDocuments(daysAhead: number = 30): Observable<Document[]> {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + daysAhead);

    const allDocuments: Document[] = [];
    this.personsSubject.value.forEach(person => {
      if (person.documents) {
        allDocuments.push(...person.documents);
      }
    });

    const expiringDocuments = allDocuments.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      return expiryDate >= currentDate && expiryDate <= futureDate;
    });

    return of(expiringDocuments);
  }

  private getNextDocumentId(): number {
    const allDocuments = this.personsSubject.value.flatMap(person => person.documents || []);
    return allDocuments.length > 0 
      ? Math.max(...allDocuments.map(doc => doc.id!)) + 1 
      : 1;
  }

  // Metodi per la gestione delle relazioni
  getRelationshipsByPersonId(personId: number): PersonRelationship[] {
    return this.relationships.filter(rel => 
      rel.personId === personId || rel.relatedPersonId === personId
    );
  }

  getAllRelationships(): PersonRelationship[] {
    return this.relationships;
  }

  addRelationship(relationship: Omit<PersonRelationship, 'id'>): PersonRelationship {
    const newRelationship: PersonRelationship = {
      ...relationship,
      id: this.getNextRelationshipId()
    };
    this.relationships.push(newRelationship);
    return newRelationship;
  }

  updateRelationship(id: number, updates: Partial<PersonRelationship>): PersonRelationship | null {
    const index = this.relationships.findIndex(rel => rel.id === id);
    if (index !== -1) {
      this.relationships[index] = { ...this.relationships[index], ...updates };
      return this.relationships[index];
    }
    return null;
  }

  deleteRelationship(id: number): boolean {
    const index = this.relationships.findIndex(rel => rel.id === id);
    if (index !== -1) {
      this.relationships.splice(index, 1);
      return true;
    }
    return false;
  }

  private getNextRelationshipId(): number {
    return this.relationships.length > 0 
      ? Math.max(...this.relationships.map(rel => rel.id!)) + 1 
      : 1;
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
        documents: [
          {
            id: 1,
            personId: 1,
            name: 'Carta d\'Identità',
            type: DocumentType.IDENTITY_CARD,
            fileName: 'carta_identita_mario_rossi.pdf',
            uploadDate: new Date('2023-01-15'),
            expiryDate: new Date('2028-01-15'),
            isActive: true,
            createdAt: new Date('2023-01-15')
          }
        ],
        relationships: [],
        isActive: true,
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
        documents: [
          {
            id: 2,
            personId: 2,
            name: 'Contratto di Lavoro',
            type: DocumentType.CONTRACT,
            fileName: 'contratto_giulia_bianchi.pdf',
            uploadDate: new Date('2023-02-10'),
            expiryDate: new Date('2025-02-10'),
            isActive: true,
            createdAt: new Date('2023-02-10')
          }
        ],
        relationships: [],
        isActive: true,
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
        documents: [
          {
            id: 3,
            personId: 3,
            name: 'Patente di Guida',
            type: DocumentType.DRIVING_LICENSE,
            fileName: 'patente_luca_verdi.pdf',
            uploadDate: new Date('2023-03-05'),
            expiryDate: new Date('2024-12-31'),
            isActive: true,
            createdAt: new Date('2023-03-05')
          }
        ],
        relationships: [],
        isActive: true,
        createdAt: new Date('2023-03-05'),
        updatedAt: new Date('2023-03-05')
      }
    ];
  }
}