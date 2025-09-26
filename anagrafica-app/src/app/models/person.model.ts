import { Address } from './address.model';
import { Contact } from './contact.model';
import { Document } from './document.model';
import { PersonRelationship } from './person-relationship.model';

export interface Person {
  id?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  fiscalCode?: string;
  gender?: 'M' | 'F' | 'Other';
  profession?: string;
  notes?: string;
  addresses: Address[];
  contacts: Contact[];
  documents?: Document[];
  relationships?: PersonRelationship[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PersonSummary {
  id: number;
  firstName: string;
  lastName: string;
  primaryEmail?: string;
  primaryPhone?: string;
}