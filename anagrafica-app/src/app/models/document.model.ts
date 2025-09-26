export interface Document {
  id?: number;
  personId: number;
  name: string;
  type: DocumentType;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  uploadDate: Date;
  expiryDate?: Date;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum DocumentType {
  IDENTITY_CARD = 'identity_card',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  FISCAL_CODE = 'fiscal_code',
  CONTRACT = 'contract',
  CERTIFICATE = 'certificate',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  OTHER = 'other'
}

export interface DocumentSummary {
  id: number;
  name: string;
  type: DocumentType;
  uploadDate: Date;
  expiryDate?: Date;
  isExpiring: boolean;
  daysToExpiry?: number;
}