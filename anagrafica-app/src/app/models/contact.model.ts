export interface Contact {
  id?: number;
  type: 'phone' | 'email' | 'fax' | 'mobile' | 'other';
  value: string;
  label?: string;
  isPrimary?: boolean;
}