import { Info, Phone, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Client } from "../lib/types";

interface ClientTableRowProps {
  client: Client;
  handleEditClient: (client: Client) => void;
  handleDeleteClient: (id: string) => void;
  setSelectedClient: (client: Client) => void;
}

export const ClientTableRow = ({ client, handleEditClient, handleDeleteClient, setSelectedClient }: ClientTableRowProps) => {
  return (
    <TableRow 
      key={client.id} 
      onClick={() => setSelectedClient(client)}
      className="hover:bg-muted/50 cursor-pointer"
    >
      <TableCell>
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-muted">
              {client.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none truncate max-w-[180px]">
              {client.name || 'Unnamed Client'}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
              {client.email || 'No email provided'}
            </p>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="font-medium">
        {client.plan || 'No plan'}
      </TableCell>
      
      <TableCell>
        <p className="text-sm font-medium">
          {client.assigned_rm || 'Unassigned'}
        </p>
      </TableCell>
      
      <TableCell>
        <p className="text-sm">
          {client.risk || 'Not specified'}
        </p>
      </TableCell>
      
      <TableCell>
        <Badge 
          variant={client.ekyc_status === 'verified' ? 'default' : 'secondary'} 
          className={client.ekyc_status === 'verified' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
        >
          {client.ekyc_status === 'verified' ? 'Verified' : 'Pending'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClient(client);
            }}
          >
            <Info className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${client.whatsapp}`;
            }}
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${client.email}`;
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
          
          {/* <Button 
            variant="outline" 
            size="sm"
            className="h-8 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClient(client.id);
            }}
          >
            Delete
          </Button> */}
        </div>
      </TableCell>
    </TableRow>
  );
};