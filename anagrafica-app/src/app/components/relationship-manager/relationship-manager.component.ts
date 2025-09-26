import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PersonService } from '../../services/person.service';
import { Person, PersonRelationship, RelationshipType } from '../../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-relationship-manager',
  templateUrl: './relationship-manager.component.html',
  styleUrls: ['./relationship-manager.component.css']
})
export class RelationshipManagerComponent implements OnInit {
  @Input() personId?: number;
  
  relationshipForm: FormGroup;
  relationships: PersonRelationship[] = [];
  persons: Person[] = [];
  filteredPersons: Observable<Person[]> = of([]);
  
  relationshipTypes = Object.values(RelationshipType);
  displayedColumns: string[] = ['relatedPerson', 'relationshipType', 'description', 'startDate', 'endDate', 'status', 'actions'];

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.relationshipForm = this.fb.group({
      relatedPersonId: ['', Validators.required],
      relationshipType: ['', Validators.required],
      description: [''],
      startDate: [new Date()],
      endDate: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadPersons();
    this.loadRelationships();
    this.setupPersonFilter();
  }

  private loadPersons(): void {
    this.personService.getPersons().subscribe(persons => {
      // Esclude la persona corrente dalla lista
      this.persons = persons.filter(p => p.id !== this.personId);
    });
  }

  private loadRelationships(): void {
    if (this.personId) {
      this.personService.getPersonById(this.personId).subscribe(person => {
        this.relationships = person?.relationships || [];
      });
    }
  }

  private setupPersonFilter(): void {
    const relatedPersonControl = this.relationshipForm.get('relatedPersonId');
    if (relatedPersonControl) {
      this.filteredPersons = relatedPersonControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterPersons(value))
      );
    }
  }

  private _filterPersons(value: string): Person[] {
    if (!value) return this.persons;
    
    const filterValue = value.toLowerCase();
    return this.persons.filter(person => 
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(filterValue) ||
      person.fiscalCode?.toLowerCase().includes(filterValue)
    );
  }

  onSubmit(): void {
    if (this.relationshipForm.valid && this.personId) {
      const formValue = this.relationshipForm.value;
      
      const newRelationship: Omit<PersonRelationship, 'id' | 'createdAt' | 'updatedAt'> = {
        personId: this.personId,
        relatedPersonId: formValue.relatedPersonId,
        relationshipType: formValue.relationshipType,
        description: formValue.description,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        isActive: formValue.isActive
      };

      // Simula l'aggiunta della relazione (in un'app reale, questo sarebbe un servizio)
      this.addRelationship(newRelationship);
    }
  }

  private addRelationship(relationship: Omit<PersonRelationship, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newRelationship: PersonRelationship = {
      ...relationship,
      id: Date.now(), // Semplice generatore di ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.relationships.push(newRelationship);
    this.relationshipForm.reset({
      isActive: true,
      startDate: new Date()
    });

    this.snackBar.open('Relazione aggiunta con successo', 'Chiudi', {
      duration: 3000
    });
  }

  editRelationship(relationship: PersonRelationship): void {
    this.relationshipForm.patchValue({
      relatedPersonId: relationship.relatedPersonId,
      relationshipType: relationship.relationshipType,
      description: relationship.description,
      startDate: relationship.startDate,
      endDate: relationship.endDate,
      isActive: relationship.isActive
    });
  }

  deleteRelationship(relationship: PersonRelationship): void {
    const relatedPerson = this.getPersonName(relationship.relatedPersonId);
    if (confirm(`Sei sicuro di voler eliminare la relazione con ${relatedPerson}?`)) {
      this.relationships = this.relationships.filter(r => r.id !== relationship.id);
      this.snackBar.open('Relazione eliminata con successo', 'Chiudi', {
        duration: 3000
      });
    }
  }

  toggleRelationshipStatus(relationship: PersonRelationship): void {
    const index = this.relationships.findIndex(r => r.id === relationship.id);
    if (index !== -1) {
      this.relationships[index] = {
        ...relationship,
        isActive: !relationship.isActive,
        updatedAt: new Date()
      };

      const status = this.relationships[index].isActive ? 'attivata' : 'disattivata';
      this.snackBar.open(`Relazione ${status}`, 'Chiudi', {
        duration: 3000
      });
    }
  }

  getPersonName(personId: number): string {
    const person = this.persons.find(p => p.id === personId);
    return person ? `${person.firstName} ${person.lastName}` : 'Persona non trovata';
  }

  getRelationshipTypeLabel(type: RelationshipType): string {
    const labels: { [key in RelationshipType]: string } = {
      [RelationshipType.CLIENT]: 'Cliente',
      [RelationshipType.SUPPLIER]: 'Fornitore',
      [RelationshipType.PARTNER]: 'Partner',
      [RelationshipType.EMPLOYEE]: 'Dipendente',
      [RelationshipType.EMPLOYER]: 'Datore di Lavoro',
      [RelationshipType.COLLEAGUE]: 'Collega',
      [RelationshipType.SPOUSE]: 'Coniuge',
      [RelationshipType.PARENT]: 'Genitore',
      [RelationshipType.CHILD]: 'Figlio/a',
      [RelationshipType.SIBLING]: 'Fratello/Sorella',
      [RelationshipType.RELATIVE]: 'Parente',
      [RelationshipType.FRIEND]: 'Amico',
      [RelationshipType.CONTACT]: 'Contatto',
      [RelationshipType.OTHER]: 'Altro'
    };
    return labels[type] || type;
  }

  getRelationshipStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getRelationshipStatusLabel(isActive: boolean): string {
    return isActive ? 'Attiva' : 'Inattiva';
  }

  clearForm(): void {
    this.relationshipForm.reset({
      isActive: true,
      startDate: new Date()
    });
  }

  // Metodo per visualizzare il profilo della persona collegata
  viewRelatedPerson(personId: number): void {
    // TODO: Implementare la navigazione al profilo della persona
    console.log('Visualizza profilo persona ID:', personId);
  }
}