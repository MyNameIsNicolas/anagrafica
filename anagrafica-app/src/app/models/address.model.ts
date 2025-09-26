export interface Address {
  id?: number;
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  type: 'home' | 'work' | 'other';
  isPrimary?: boolean;
}