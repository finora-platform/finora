import { supabase } from "./supabaseClient";

// Define TypeScript Interface for Strong Typing
export interface Client {
  id: number;
  Name: string;
  "Whatsapp r": string;
  role: string;
  email: string;
  "assigned RN": string;
  Risk: string;
  "Ekyc status": string;
  Plan: string;
}

// 🟢 Create a New Client
export const createClient = async (client: Omit<Client, "id">) => {
  const { data, error } = await supabase.from("clients").insert([client]);
  if (error) throw error;
  return data;
};

// 🔵 Read (Fetch) All Clients
export const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return data as Client[];
};

// 🟡 Update a Client
export const updateClient = async (id: number, updates: Partial<Client>) => {
  const { data, error } = await supabase.from("clients").update(updates).eq("id", id);
  if (error) throw error;
  return data;
};

// 🔴 Delete a Client
export const deleteClient = async (id: number) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
};
