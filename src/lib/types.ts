export interface Client {
    id: number;
    name:string;
    email: string;
    phone: string;
    kyc_status: "verified" | "pending" | "rejected";
    kyc_verified_at: string | null;
    risk_profile: "Aggressive" | "Moderate" | "Conservative" | "High";
    ra_id: number; // Risk Assessment ID
    rm_id: number; // Relationship Manager ID
    current_plan_id: number;
    status: "active" | "inactive";
    last_active_at: string;
    created_at: string;
    updated_at: string;
    rm_name: string;
    rm_email: string;
    plan: string;
    risk: string;
    days_to_renewal: number | null;
  }
  
  export interface RelationshipManager {
    id: number;
    name: string;
  }

  export interface SortDirection {
    direction: 'asc' | 'desc' | null;
  }

  export interface SortField {
    field: 'name' | 'days_to_renewal' | 'rm_name' | 'risk_profile' | 'plan_name' | null;
  }
  