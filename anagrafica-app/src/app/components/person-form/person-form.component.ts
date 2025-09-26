import { Component, OnInit, ChangeDetectorRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonService } from '../../services';
import { Person, Address, Contact } from '../../models';

@Component({
  selector: 'app-person-form',
  templateUrl: './person-form.component.html',
  styleUrls: ['./person-form.component.css']
})
export class PersonFormComponent implements OnInit, AfterViewInit {
  personForm: FormGroup;
  isEditMode = false;
  personId: number | null = null;
  isSubmitting = false;

  @ViewChildren(MatExpansionPanel) expansionPanels!: QueryList<MatExpansionPanel>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.personForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.personId = +params['id'];
        this.isEditMode = true;
        this.loadPerson();
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [''],
      fiscalCode: ['', [Validators.pattern(/^[A-Za-z]{6}[0-9]{2}[A-Za-z][0-9]{2}[A-Za-z][0-9]{3}[A-Za-z]$/)]],
      gender: [''],
      profession: [''],
      notes: [''],
      addresses: this.fb.array([]),
      contacts: this.fb.array([])
    });
  }

  private loadPerson(): void {
    if (this.personId) {
      this.personService.getPersonById(this.personId).subscribe(person => {
        if (person) {
          this.populateForm(person);
        }
      });
    }
  }

  private populateForm(person: Person): void {
    this.personForm.patchValue({
      firstName: person.firstName,
      lastName: person.lastName,
      dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth).toISOString().split('T')[0] : '',
      fiscalCode: person.fiscalCode || '',
      gender: person.gender || '',
      profession: person.profession || '',
      notes: person.notes || ''
    });

    // Populate addresses
    const addressesArray = this.personForm.get('addresses') as FormArray;
    person.addresses.forEach(address => {
      addressesArray.push(this.createAddressGroup(address));
    });

    // Populate contacts
    const contactsArray = this.personForm.get('contacts') as FormArray;
    person.contacts.forEach(contact => {
      contactsArray.push(this.createContactGroup(contact));
    });
  }

  get addresses(): FormArray {
    return this.personForm.get('addresses') as FormArray;
  }

  get contacts(): FormArray {
    return this.personForm.get('contacts') as FormArray;
  }

  createAddressGroup(address?: Address): FormGroup {
    return this.fb.group({
      street: [address?.street || '', Validators.required],
      city: [address?.city || '', Validators.required],
      postalCode: [address?.postalCode || '', Validators.required],
      province: [address?.province || '', Validators.required],
      country: [address?.country || 'Italia', Validators.required],
      type: [address?.type || 'home', Validators.required],
      isPrimary: [address?.isPrimary || false]
    });
  }

  createContactGroup(contact?: Contact): FormGroup {
    return this.fb.group({
      type: [contact?.type || 'email', Validators.required],
      value: [contact?.value || '', Validators.required],
      label: [contact?.label || ''],
      isPrimary: [contact?.isPrimary || false]
    });
  }

  // Gestione contatti principali
  onPrimaryContactChange(contactIndex: number, event: any): void {
    const isPrimary = event.checked;
    if (isPrimary) {
      // Se questo contatto diventa principale, rimuovi il flag da tutti gli altri dello stesso tipo
      const currentType = this.contacts.at(contactIndex).get('type')?.value;
      
      this.contacts.controls.forEach((contact, index) => {
        if (index !== contactIndex && contact.get('type')?.value === currentType) {
          contact.get('isPrimary')?.setValue(false);
        }
      });
    }
  }

  // Gestione indirizzi principali
  onPrimaryAddressChange(addressIndex: number, event: any): void {
    const isPrimary = event.checked;
    if (isPrimary) {
      // Se questo indirizzo diventa principale, rimuovi il flag da tutti gli altri dello stesso tipo
      const currentType = this.addresses.at(addressIndex).get('type')?.value;
      
      this.addresses.controls.forEach((address, index) => {
        if (index !== addressIndex && address.get('type')?.value === currentType) {
          address.get('isPrimary')?.setValue(false);
        }
      });
    }
  }

  ngAfterViewInit(): void {
    // Monitor changes to expansion panels
    this.expansionPanels.changes.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  addAddress(): void {
    this.addresses.push(this.createAddressGroup());
    // Force immediate change detection and re-render
    this.cdr.detectChanges();
    
    // Additional timeout to ensure Material Design styles are applied
    setTimeout(() => {
      this.cdr.detectChanges();
      // Force re-initialization of newly created expansion panels
      this.expansionPanels.forEach(panel => {
        if (panel._body) {
          panel._body.nativeElement.style.display = 'block';
        }
      });
    }, 50);
  }

  removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  addContact(): void {
    this.contacts.push(this.createContactGroup());
    // Force immediate change detection and re-render
    this.cdr.detectChanges();
    
    // Additional timeout to ensure Material Design styles are applied
    setTimeout(() => {
      this.cdr.detectChanges();
      // Force re-initialization of newly created expansion panels
      this.expansionPanels.forEach(panel => {
        if (panel._body) {
          panel._body.nativeElement.style.display = 'block';
        }
      });
    }, 50);
  }

  removeContact(index: number): void {
    this.contacts.removeAt(index);
  }

  saveAddress(index: number, panel: MatExpansionPanel): void {
    const addressGroup = this.addresses.at(index);
    if (addressGroup.valid) {
      this.snackBar.open('Indirizzo salvato con successo', 'Chiudi', {
        duration: 2000
      });
      // Chiudi l'accordion dopo il salvataggio
      panel.close();
    } else {
      this.snackBar.open('Compila tutti i campi obbligatori dell\'indirizzo', 'Chiudi', {
        duration: 3000
      });
    }
  }

  saveContact(index: number, panel: MatExpansionPanel): void {
    const contactGroup = this.contacts.at(index);
    if (contactGroup.valid) {
      this.snackBar.open('Contatto salvato con successo', 'Chiudi', {
        duration: 2000
      });
      // Chiudi l'accordion dopo il salvataggio
      panel.close();
    } else {
      this.snackBar.open('Compila tutti i campi obbligatori del contatto', 'Chiudi', {
        duration: 3000
      });
    }
  }

  onSubmit(): void {
    if (this.personForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.personForm.value;
      
      const person: Person = {
        ...formValue,
        dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined,
        fiscalCode: formValue.fiscalCode ? formValue.fiscalCode.toUpperCase() : undefined
      };

      if (this.isEditMode && this.personId) {
        this.personService.updatePerson(this.personId, person).subscribe(() => {
          this.router.navigate(['/person', this.personId]);
        });
      } else {
        this.personService.addPerson(person).subscribe((newPerson) => {
          this.router.navigate(['/person', newPerson.id]);
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.personForm.controls).forEach(key => {
      const control = this.personForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(nestedKey => {
              arrayControl.get(nestedKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  goBack(): void {
    if (this.isEditMode && this.personId) {
      this.router.navigate(['/person', this.personId]);
    } else {
      this.router.navigate(['/persons']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.personForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.personForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Campo obbligatorio';
      if (field.errors['minlength']) return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
      if (field.errors['pattern']) {
        if (fieldName === 'fiscalCode') {
          return 'Il codice fiscale deve avere 16 caratteri (es. RSSMRA85C15H501Z)';
        }
        return 'Formato non valido';
      }
    }
    return '';
  }

  getContactIcon(type: string): string {
    switch (type) {
      case 'email': return 'email';
      case 'phone': return 'phone';
      case 'mobile': return 'smartphone';
      case 'fax': return 'print';
      case 'other': return 'contact_support';
      default: return 'contact_phone';
    }
  }
}
