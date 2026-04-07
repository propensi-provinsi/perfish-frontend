export interface CurrencyResponse {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CurrencyRequest {
  currencyCode: string;
  currencyName: string;
  isActive?: boolean;
}

export interface BankAccountResponse {
  accountId: number;
  branchId: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface BankAccountRequest {
  branchId: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive?: boolean;
}

export interface TaxResponse {
  taxId: number;
  taxCode: string;
  taxPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface TaxRequest {
  taxCode: string;
  taxPercentage: number;
  isActive?: boolean;
}

export interface PaymentTermResponse {
  paymentTermId: number;
  termCode: string;
  termName: string;
  days: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PaymentTermRequest {
  termCode: string;
  termName: string;
  days: number;
  isActive?: boolean;
}
