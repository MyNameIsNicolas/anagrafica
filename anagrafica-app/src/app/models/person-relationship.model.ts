export interface PersonRelationship {
  id?: number;
  personId: number;
  relatedPersonId: number;
  relationshipType: RelationshipType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum RelationshipType {
  // Relazioni commerciali
  CLIENT = 'client',
  SUPPLIER = 'supplier',
  PARTNER = 'partner',
  
  // Relazioni lavorative
  EMPLOYEE = 'employee',
  EMPLOYER = 'employer',
  COLLEAGUE = 'colleague',
  
  // Relazioni familiari
  SPOUSE = 'spouse',
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  RELATIVE = 'relative',
  
  // Altre relazioni
  FRIEND = 'friend',
  CONTACT = 'contact',
  OTHER = 'other'
}

export interface RelationshipSummary {
  id: number;
  relatedPersonName: string;
  relationshipType: RelationshipType;
  isActive: boolean;
  startDate?: Date;
}