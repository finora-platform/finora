import { Info, Phone, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const ClientActions = ({ client, handleEditClient, handleDeleteClient }) => {
  return (
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
  );
};