import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CSVUpload from "./CSVUpload";

interface CSVImportDialogProps {
  showCSVDialog: boolean;
  setShowCSVDialog: (open: boolean) => void;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ showCSVDialog, setShowCSVDialog }) => {
  return (
    <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
      <DialogContent side="right" className="sm:max-w-[33vw] absolute right-0 h-full">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file containing client data</DialogDescription>
        </DialogHeader>
        <CSVUpload />
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
