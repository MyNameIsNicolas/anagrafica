import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonService } from '../../services';
import { Person, Address, Contact } from '../../models';

@Component({
  selector: 'app-person-form',
  templateUrl: './person-form.component.html',
  styleUrls: ['./person-form.component.css']
})
export class PersonFormComponent implements OnInit {
  personForm: FormGroup;
  isEditMode = false;
  personId: number | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService
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
      fiscalCode: ['', [Validators.pattern(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/)]],
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
      type: [address?.type || 'home', Validators.required]
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

  addAddress(): void {
    this.addresses.push(this.createAddressGroup());
  }

  removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  addContact(): void {
    this.contacts.push(this.createContactGroup());
  }

  removeContact(index: number): void {
    this.contacts.removeAt(index);
  }

  onSubmit(): void {
    if (this.personForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.personForm.value;
      
      const person: Person = {
        ...formValue,
        dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined
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
      if (field.errors['pattern']) return 'Formato non valido';
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
