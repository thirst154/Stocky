import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { units } from "@/lib/data";

interface UnitSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function UnitSelect({ value, onValueChange }: UnitSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Units</SelectLabel>
          {units.map((unit) => (
            <SelectItem key={unit.value} value={unit.value}>
              {unit.short ?? unit.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
