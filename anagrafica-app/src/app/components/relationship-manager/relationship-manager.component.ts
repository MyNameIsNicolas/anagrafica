import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  loading = false;
  personName = '';
  editingRelationship: PersonRelationship | null = null;
  
  relationshipTypes = Object.values(RelationshipType);
  displayedColumns: string[] = ['relatedPerson', 'relationshipType', 'description', 'startDate', 'endDate', 'status', 'actions'];

  constructor(
    private route: ActivatedRoute,
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
    // Se personId non è fornito come Input, lo prendiamo dalla route
    if (!this.personId) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.personId = +id;
      }
    }
    
    if (this.personId) {
      this.loadPersons();
      this.loadRelationships();
      this.setupPersonFilter();
      this.loadPersonName();
    } else {
      this.snackBar.open('ID persona non trovato', 'Chiudi', {
        duration: 3000
      });
    }
  }

  private loadPersonName(): void {
    if (this.personId) {
      this.personService.getPersonById(this.personId).subscribe(person => {
        if (person) {
          this.personName = `${person.firstName} ${person.lastName}`;
        }
      });
    }
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
      
      if (this.editingRelationship) {
        // Modalità modifica
        this.updateRelationship(formValue);
      } else {
        // Modalità aggiunta
        const newRelationship: Omit<PersonRelationship, 'id' | 'createdAt' | 'updatedAt'> = {
          personId: this.personId,
          relatedPersonId: formValue.relatedPersonId,
          relationshipType: formValue.relationshipType,
          description: formValue.description,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          isActive: formValue.isActive
        };

        this.addRelationship(newRelationship);
      }
    }
  }

  private updateRelationship(formValue: any): void {
    if (!this.editingRelationship) return;

    const updatedRelationship: PersonRelationship = {
      ...this.editingRelationship,
      relatedPersonId: formValue.relatedPersonId,
      relationshipType: formValue.relationshipType,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      isActive: formValue.isActive,
      updatedAt: new Date()
    };

    const index = this.relationships.findIndex(r => r.id === this.editingRelationship!.id);
    if (index !== -1) {
      this.relationships[index] = updatedRelationship;
      this.snackBar.open('Relazione aggiornata con successo', 'Chiudi', {
        duration: 3000
      });
      this.cancelEdit();
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
    this.editingRelationship = relationship;
    this.relationshipForm.patchValue({
      relatedPersonId: relationship.relatedPersonId,
      relationshipType: relationship.relationshipType,
      description: relationship.description,
      startDate: relationship.startDate,
      endDate: relationship.endDate,
      isActive: relationship.isActive
    });

    this.snackBar.open('Modalità modifica attivata', 'Chiudi', {
      duration: 2000
    });
  }

  cancelEdit(): void {
    this.editingRelationship = null;
    this.clearForm();
  }

  deleteRelationship(relationship: PersonRelationship): void {
    const relatedPerson = this.getPersonName(relationship.relatedPersonId);
    
    setTimeout(() => {
      if (confirm(`Sei sicuro di voler eliminare la relazione con ${relatedPerson}?`)) {
        this.relationships = this.relationships.filter(r => r.id !== relationship.id);
        this.snackBar.open('Relazione eliminata con successo', 'Chiudi', {
          duration: 3000
        });
        
        // Se stavamo modificando questa relazione, annulla la modifica
        if (this.editingRelationship && this.editingRelationship.id === relationship.id) {
          this.cancelEdit();
        }
      }
    }, 0);
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
    this.editingRelationship = null;
    this.relationshipForm.reset({
      isActive: true,
      startDate: new Date()
    });
  }

  isEditing(): boolean {
    return this.editingRelationship !== null;
  }

  getFormButtonText(): string {
    return this.isEditing() ? 'Aggiorna Relazione' : 'Aggiungi Relazione';
  }

  getFormButtonIcon(): string {
    return this.isEditing() ? 'update' : 'add';
  }

  // Metodo per visualizzare il profilo della persona collegata
  viewRelatedPerson(personId: number): void {
    // TODO: Implementare la navigazione al profilo della persona
    console.log('Visualizza profilo persona ID:', personId);
  }
}