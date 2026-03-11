export interface CustomerData {
  customerId: number;
  customerCode: string;
  customerName: string;
  customerType: string;
  address: string;
  contactNumber: string;
  email: string;
  destinationCountry?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface CreateCustomerPayload {
  customerName: string;
  customerType?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  destinationCountry?: string;
}

export const CUSTOMER_TYPES = [
  { value: "Lokal", label: "Lokal" },
  { value: "Ekspor", label: "Ekspor" },
] as const;