import { Info, Phone, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Client } from "../lib/types";

interface ClientTableRowProps {
  client: Client;
  handleEditClient: (client: Client) => void;
  handleDeleteClient: (id: string) => void;
  setSelectedClient: (client: Client) => void;
}

export const ClientTableRow = ({ client, handleEditClient, handleDeleteClient, setSelectedClient }: ClientTableRowProps) => {
  return (
    <TableRow key={client.id} onClick={() => setSelectedClient(client)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {client.name?.charAt(0) || '?'}
          </div>
          <div>
            <div className="font-medium truncate max-w-[200px]">{client.name || 'Unnamed'}</div>
            <div className="text-sm text-muted-foreground">
              {client.email || 'No email'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">
          {client.plan || 'No plan'}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{client.assigned_rm || 'Unassigned'}</div>
      </TableCell>
      <TableCell>{client.risk || 'Not specified'}</TableCell>
      <TableCell>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${client.ekyc_status === 'verified'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
          }`}>
          {client.ekyc_status === 'verified' ? 'Verified' : 'Pending'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            handleEditClient(client);
          }}>
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            window.location.href = `tel:${client.whatsapp}`;
          }}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            window.location.href = `mailto:${client.email}`;
          }}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="destructive" onClick={() => handleDeleteClient(client.id)} className="ml-2">
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};