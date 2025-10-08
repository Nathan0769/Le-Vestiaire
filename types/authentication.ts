export type Brand = "adidas" | "nike" | "puma" | "hummel";

export interface BrandInfo {
  id: Brand;
  name: string;
  logo: string;
  description: string;
  color: string;
}

export interface AuthenticationCriterion {
  title: string;
  description: string;
  points: string[];
  image?: string;
}

export interface BrandGuide {
  brand: Brand;
  title: string;
  description: string;
  scanAvailable: boolean;
  criteria: AuthenticationCriterion[];
  commonFakes: string[];
  tips: string[];
}
