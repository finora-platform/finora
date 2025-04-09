import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PlusCircle, Upload, UserPlus } from 'lucide-react';

interface ClientFiltersProps {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedRiskProfile: string;
  setSelectedRiskProfile: (profile: string) => void;
  excludeInactive: boolean;
  setExcludeInactive: (checked: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resetFilters: () => void;
  plans: string[];
  riskProfiles: string[];
  setShowAddClientDialog: (show: boolean) => void;
  setShowCSVDialog: (show: boolean) => void;
  setExistingClient: (client: Client | null) => void;
}

export const ClientFilters = ({
  selectedPlan,
  setSelectedPlan,
  selectedRiskProfile,
  setSelectedRiskProfile,
  excludeInactive,
  setExcludeInactive,
  searchTerm,
  setSearchTerm,
  resetFilters,
  plans,
  riskProfiles,
  setShowAddClientDialog,
  setShowCSVDialog,
  setExistingClient,
}: ClientFiltersProps) => {
  return (
    <div className="flex items-center gap-4 mb-4 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{selectedPlan}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setSelectedPlan("All Plans")}>
            All Plans
          </DropdownMenuItem>
          {plans.map((plan) => (
            <DropdownMenuItem key={plan} onClick={() => setSelectedPlan(plan)}>
              {plan}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{selectedRiskProfile}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setSelectedRiskProfile("All Risk Profiles")}>
            All Risk Profiles
          </DropdownMenuItem>
          {riskProfiles.map((profile) => (
            <DropdownMenuItem key={profile} onClick={() => setSelectedRiskProfile(profile)}>
              {profile}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="text-primary">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => {
            setExistingClient(null);
            setShowAddClientDialog(true);
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Insert Client</span>
              <span className="text-xs text-muted-foreground">Insert client details</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCSVDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Import Data from CSV</span>
              <span className="text-xs text-muted-foreground">Insert new clients from CSV</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className="text-primary" onClick={resetFilters}>
        Reset Filters
      </Button>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="excludeInactive"
            checked={excludeInactive}
            onCheckedChange={(checked) => setExcludeInactive(checked)}
          />
          <label htmlFor="excludeInactive">Exclude inactive clients</label>
        </div>

        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-[300px]"
        />
      </div>
    </div>
  );
};