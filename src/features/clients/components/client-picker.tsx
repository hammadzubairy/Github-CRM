"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Client } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const NEW_CLIENT_PREFIX = "new:";

export function ClientPicker({
  id,
  clients,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);
  const selected = clients.find((c) => c.id === value);
  const pendingName = value.startsWith(NEW_CLIENT_PREFIX) ? value.slice(NEW_CLIENT_PREFIX.length) : null;
  const trimmed = query.trim();
  const exact = trimmed && sorted.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between font-normal",
            !selected && !pendingName && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected
              ? selected.name
              : pendingName
                ? `${pendingName} (new client)`
                : "Search or add a client"}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clients…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            {trimmed && !exact ? (
              <CommandGroup>
                <CommandItem
                  value={`__create ${trimmed}`}
                  onSelect={() => {
                    onChange(`${NEW_CLIENT_PREFIX}${trimmed}`);
                    setOpen(false);
                  }}
                >
                  <UserPlusIcon /> Add “{trimmed}” as a new client
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Clients">
              {sorted.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name} ${client.email}`}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <CheckIcon className={cn(value === client.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{client.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{client.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
