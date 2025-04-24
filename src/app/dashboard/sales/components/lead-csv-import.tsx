import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeadCSVUpload from "./lead-csv-upload";

interface LeadCSVImportDialogProps {
  show: boolean;
  setShow: (open: boolean) => void;
}

const LeadCSVImportDialog: React.FC<LeadCSVImportDialogProps> = ({ show, setShow }) => {
  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-[33vw]"> {/* Removed side and absolute classes */}
        <DialogHeader>
          {/* <DialogTitle>Import Leads from CSV</DialogTitle> */}
          {/* <DialogDescription>Upload a CSV file containing lead data</DialogDescription> */}
        </DialogHeader>
        <LeadCSVUpload />
      </DialogContent>
    </Dialog>
  );
};

export default LeadCSVImportDialog;
