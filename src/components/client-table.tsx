
"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientFilters } from "./ClientFilters";
import { ClientTableHeader } from "./ClientTableHeader";
import { ClientTableRow } from "./ClientTableRow";
import { ClientTableSkeleton } from "./skeleton/client-table-skeleton";
import ClientSidePanel from "./clientsidepanel";
import ClientForm from "./add-client";
import CSVUpload from "@/components/add-csv";
import { Client } from "../lib/types";
import { useSession, useUser } from '@clerk/nextjs';
import { createClerkSupabaseClient, SupabaseClient } from "@/utils/supabaseClient";

export default function ClientTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [excludeInactive, setExcludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskProfile, setSelectedRiskProfile] = useState("All Risk Profiles");
  const [selectedPlan, setSelectedPlan] = useState("All Plans");
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [latestTrades, setLatestTrades] = useState<Record<string, any>>({});

  const { session, isLoaded } = useSession();
  const { user } = useUser();

  const plans = ["premium", "standard", "elite"];
  const riskProfiles = ["conservative", "high", "aggressive"];

  useEffect(() => {
    if (isLoaded && session) {
      const initializeSupabaseClient = async () => {
        const client = await createClerkSupabaseClient(session);
        if (client) {
          setSupabaseClient(client);
          fetchClients(client);
          fetchLatestTrades(client);
        }
      };
      initializeSupabaseClient();
    }
  }, [isLoaded, session]);

  const fetchClients = async (client) => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await client
        .from('client3')
        .select('*')
        .filter('user_id', 'eq', user.id.toString());
      
      if (error) throw error;
      
      setClients(data || []);
    } catch (err) {
      setError(`Error fetching clients: ${err.message}`);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

//   const fetchLatestTrades = async (client: SupabaseClient) => {
//     try {
//       // First get all user_trades for this advisor
//       const { data: tradesData, error: tradesError } = await client
//         .from('user_trades')
//         .select('user_id, trade_data')
//         .eq('advisor_id', user?.id);
  
//       if (tradesError) throw tradesError;
//       if (!tradesData) return;
  
//       // Process to get the latest trade for each client
//       const latestTradesMap: Record<string, any> = {};
  
//       tradesData.forEach(trade => {
//         try {
//           // Handle case where trade_data might be a string or array
//           let tradeData = trade.trade_data;
          
//           // If it's a string, parse it as JSON
//           if (typeof tradeData === 'string') {
//             try {
//               tradeData = JSON.parse(tradeData);
//             } catch (e) {
//               console.warn('Failed to parse trade_data as JSON for user:', trade.user_id);
//               return;
//             }
//           }
  
//           // Ensure we have an array at this point
// // Normalize tradeData to an array
// if (!Array.isArray(tradeData)) {
//   if (typeof tradeData === 'object' && tradeData !== null) {
//     tradeData = [tradeData]; // wrap single trade in an array
//   } else {
//     console.warn('Invalid trade_data format for user:', trade.user_id, tradeData);
//     return;
//   }
// }

  
//           // Filter out invalid entries and ensure createdAt exists
//           const validTrades = tradeData.filter(t => 
//             t && 
//             typeof t === 'object' && 
//             t.createdAt && 
//             typeof t.createdAt === 'string'
//           );
  
//           if (validTrades.length === 0) return;
  
//           // Get the most recent trade by createdAt
//           const latestTrade = validTrades.reduce((latest, current) => {
//             try {
//               const currentDate = new Date(current.createdAt).getTime();
//               const latestDate = new Date(latest.createdAt).getTime();
//               return currentDate > latestDate ? current : latest;
//             } catch (e) {
//               return latest; // If date parsing fails, keep the previous latest
//             }
//           });
  
//           if (trade.user_id) {
//             latestTradesMap[trade.user_id] = latestTrade;
//           }
//         } catch (err) {
//           console.error('Error processing trades for user:', trade.user_id, err);
//         }
//       });
  
//       setLatestTrades(latestTradesMap);
//     } catch (err) {
//       console.error('Error fetching latest trades:', err);
//       // Optionally set an error state here if you want to display it
//     }
//   };

  const handleDeleteClient = async (id: string) => {
    if (!supabaseClient) {
      setError('Supabase client is not initialized');
      return;
    }
  
    if (!window.confirm('Are you sure you want to delete this client?')) return;
  
    try {
      const { error } = await supabaseClient
        .from('client3')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
  
      await fetchClients(supabaseClient);
    } catch (err) {
      setError(`Error deleting client: ${err.message}`);
      console.error('Error deleting client:', err);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
  
    try {
      if (existingClient) {
        const { data, error } = await supabaseClient
          .from('client3')
          .update(formData)
          .eq('id', existingClient.id);
  
        if (error) throw error;
  
        await fetchClients(supabaseClient);
      } else {
        const { data, error } = await supabaseClient
          .from('client3')
          .insert([{ ...formData, user_id: String(user.id) }]);
        if (error) throw error;
  
        await fetchClients(supabaseClient);
      }
  
      setShowAddClientDialog(false);
      setExistingClient(null);
    } catch (err) {
      setError(`Error submitting client: ${err.message}`);
      console.error('Error submitting client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = (client) => {
    setExistingClient(client);
    setShowAddClientDialog(true);
  };

  const filteredClients = clients
    .filter(client => {
      if (excludeInactive && client.status === 'inactive') return false;
      if (searchTerm && !client.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedRiskProfile !== "All Risk Profiles" && client.risk !== selectedRiskProfile) return false;
      if (selectedPlan !== "All Plans" && client.plan !== selectedPlan) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0;

      if (a[sortField] === null) return sortDirection === 'asc' ? -1 : 1;
      if (b[sortField] === null) return sortDirection === 'asc' ? 1 : -1;

      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRiskProfile('All Risk Profiles');
    setSelectedPlan('All Plans');
    setExcludeInactive(false);
  };

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ClientFilters
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedRiskProfile={selectedRiskProfile}
        setSelectedRiskProfile={setSelectedRiskProfile}
        excludeInactive={excludeInactive}
        setExcludeInactive={setExcludeInactive}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        resetFilters={resetFilters}
        plans={plans}
        riskProfiles={riskProfiles}
        setShowAddClientDialog={setShowAddClientDialog}
        setShowCSVDialog={setShowCSVDialog}
        setExistingClient={setExistingClient}
      />

      <div className="rounded-md border">
        <ScrollArea className="h-[80vh] rounded-md border">
          <Table>
            <ClientTableHeader handleSort={handleSort} sortField={sortField} />
            <TableBody>
              {loading ? (
                <ClientTableSkeleton />
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found. Try adjusting your filters or add a new client.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <ClientTableRow
                    key={client.id}
                    client={client}
                    latestTrade={latestTrades[client.id]}
                    handleEditClient={handleEditClient}
                    handleDeleteClient={handleDeleteClient}
                    setSelectedClient={setSelectedClient}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {selectedClient && (
        <ClientSidePanel
          client={selectedClient}
          latestTrade={latestTrades[selectedClient.id]}
          onClose={() => setSelectedClient(null)}
        />
      )}

      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{existingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {existingClient ? "Update the client's details" : "Enter the client's details below"}
              <ClientForm
                onSubmit={handleSubmit}
                initialData={existingClient}
                isLoading={isSubmitting}
                onCancel={() => setShowAddClientDialog(false)}
                mode={existingClient ? "edit" : "create"}
              />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
        <DialogContent side="right" className="sm:max-w-[33vw] absolute right-0 h-full">
          <DialogHeader>
            <DialogTitle>Import Clients from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file containing client data
            </DialogDescription>
          </DialogHeader>
          <CSVUpload />
        </DialogContent>
      </Dialog>
    </div>
  );
}
