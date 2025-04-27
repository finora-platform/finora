"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface FilterDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
}

/**
 * Renders a dropdown menu for selecting a filter option.
 *
 * Displays a button showing the current value, and a dropdown list of options.
 * Highlights the selected option and calls onChange when a new option is selected.
 *
 * @component
 * @param {FilterDropdownProps} props - The props for the filter dropdown.
 * @param {string[]} props.options - Array of filter options to display.
 * @param {string} props.value - Currently selected value.
 * @param {(value: string) => void} props.onChange - Callback when a new option is selected.
 *
 * @example
 * <FilterDropdown options={["All", "Active", "Inactive"]} value="All" onChange={setValue} />
 */
export const FilterDropdown = ({ options, value, onChange }: FilterDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-auto justify-between">
          {value}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[150px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={option === value ? "bg-muted" : ""}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
