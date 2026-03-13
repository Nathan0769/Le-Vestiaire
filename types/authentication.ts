export type Brand = "adidas" | "nike" | "puma" | "hummel";

export interface BrandInfo {
  id: Brand;
  name: string;
  logo: string;
  logoDark: string;
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

export interface ComparisonPoint {
  title: string;
  description?: string;
  supporter: string;
  pro: string;
  supporterImage?: string;
  proImage?: string;
}

export interface SupporterVsProGuide {
  title: string;
  description: string;
  context: string;
  supporterFullImage?: string;
  proFullImage?: string;
  comparisons: ComparisonPoint[];
}
