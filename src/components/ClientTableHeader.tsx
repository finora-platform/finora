import { ArrowUpDown } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClientTableHeaderProps {
  handleSort: (field: string) => void;
  sortField: string | null;
}

export const ClientTableHeader = ({ handleSort, sortField }: ClientTableHeaderProps) => {
  const headers = [
    { field: 'name', label: 'Client' },
    { field: 'plan', label: 'Plan' },
    { field: 'assigned_rm', label: 'Assigned RM' },
    { field: 'risk', label: 'Risk profile' },
    { field: 'ekyc_status', label: 'KYC Status' },
  ];

  return (
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header.field} onClick={() => handleSort(header.field)} className="cursor-pointer">
            {header.label} {sortField === header.field && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
          </TableHead>
        ))}
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};