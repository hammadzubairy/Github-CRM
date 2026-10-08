"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Client } from "@/lib/data/types";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatCurrency, initials } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";
import { EmptyState, PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { buildClientRows, clientStatuses, clientStatusMeta, collectTags, type ClientRow } from "../stats";
import { ClientDialog } from "./client-dialog";

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { basic: sortFn_basic, text: sortFn_text },
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
    arrIncludes: filterFn_arrIncludes,
  },
  columnMeta: {} as { className?: string },
});

const columnHelper = createColumnHelper<typeof features, ClientRow>();

export function StatusPill({ status }: { status: Client["status"] }) {
  const meta = clientStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function SortButton({
  label,
  sorted,
  onClick,
  align = "left",
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick?: (event: unknown) => void;
  align?: "left" | "right";
}) {
  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
        align === "right" && "flex-row-reverse",
        sorted && "text-foreground",
      )}
    >
      {label}
      <Icon className={cn("size-3.5", !sorted && "opacity-40")} />
    </button>
  );
}

export function ClientsView() {
  const router = useRouter();
  const business = useActiveBusiness();
  const clients = useScoped("clients");
  const appointments = useScoped("appointments");
  const deleteClients = useAppStore((s) => s.deleteClients);
  const tagClients = useAppStore((s) => s.tagClients);
  const clientDialogOpen = useUiStore((s) => s.clientDialogOpen);
  const setClientDialogOpen = useUiStore((s) => s.setClientDialogOpen);
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);
  const currency = business?.currency ?? "USD";

  const [now] = useState(() => new Date());
  const data = useMemo(() => buildClientRows(clients, appointments, now), [clients, appointments, now]);
  const tags = useMemo(() => collectTags(clients), [clients]);

  const [sorting, setSorting] = useState<SortingState>([{ id: "lastVisit", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [editing, setEditing] = useState<Client | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          meta: { className: "w-10" },
          header: ({ table }) => (
            <Checkbox
              aria-label="Select all clients on this page"
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              aria-label={`Select ${row.original.name}`}
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
              onClick={(e) => e.stopPropagation()}
            />
          ),
        }),
        columnHelper.accessor((row) => `${row.name} ${row.email} ${row.phone}`, {
          id: "client",
          sortFn: "text",
          header: ({ column }) => (
            <SortButton
              label="Client"
              sorted={column.getIsSorted()}
              onClick={column.getToggleSortingHandler()}
            />
          ),
          cell: ({ row }) => (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                {initials(row.original.name)}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/app/clients/${row.original.id}`}
                  className="block truncate font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.original.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.email || row.original.phone || "No contact info"}
                </p>
              </div>
            </div>
          ),
        }),
        columnHelper.accessor("status", {
          filterFn: "equalsString",
          enableGlobalFilter: false,
          header: ({ column }) => (
            <SortButton
              label="Status"
              sorted={column.getIsSorted()}
              onClick={column.getToggleSortingHandler()}
            />
          ),
          cell: ({ getValue }) => <StatusPill status={getValue()} />,
        }),
        columnHelper.accessor("tags", {
          enableSorting: false,
          enableGlobalFilter: false,
          filterFn: "arrIncludes",
          meta: { className: "hidden lg:table-cell" },
          header: "Tags",
          cell: ({ getValue }) => {
            const value = getValue();
            return value.length ? (
              <div className="flex flex-wrap gap-1">
                {value.map((t) => (
                  <span key={t} className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          },
        }),
        columnHelper.accessor("visits", {
          sortFn: "basic",
          sortDescFirst: true,
          enableGlobalFilter: false,
          meta: { className: "hidden text-right md:table-cell" },
          header: ({ column }) => (
            <SortButton
              label="Visits"
              align="right"
              sorted={column.getIsSorted()}
              onClick={column.getToggleSortingHandler()}
            />
          ),
          cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
        }),
        columnHelper.accessor((row) => row.lastVisit ?? "", {
          id: "lastVisit",
          sortFn: "text",
          sortDescFirst: true,
          enableGlobalFilter: false,
          meta: { className: "hidden sm:table-cell" },
          header: ({ column }) => (
            <SortButton
              label="Last visit"
              sorted={column.getIsSorted()}
              onClick={column.getToggleSortingHandler()}
            />
          ),
          cell: ({ getValue }) => {
            const value = getValue();
            return value ? (
              <span title={format(new Date(value), "PPP")} className="text-muted-foreground">
                {formatDistanceToNowStrict(new Date(value), { addSuffix: true })}
              </span>
            ) : (
              <span className="text-muted-foreground">Never</span>
            );
          },
        }),
        columnHelper.accessor("spent", {
          sortFn: "basic",
          sortDescFirst: true,
          enableGlobalFilter: false,
          meta: { className: "text-right" },
          header: ({ column }) => (
            <SortButton
              label="Lifetime value"
              align="right"
              sorted={column.getIsSorted()}
              onClick={column.getToggleSortingHandler()}
            />
          ),
          cell: ({ getValue }) => (
            <span className="font-medium tabular-nums">{formatCurrency(getValue(), currency)}</span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          meta: { className: "w-10" },
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={() => openNewAppointment({ clientId: row.original.id })}>
                  <CalendarPlusIcon /> Book appointment
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                  <PencilIcon /> Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete([row.original.id])}>
                  <Trash2Icon /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        }),
      ]),
    [currency, openNewAppointment],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    globalFilterFn: "includesString",
    state: { sorting, globalFilter, columnFilters, rowSelection, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  });

  const selectedIds = useMemo(() => {
    const existing = new Set(data.map((r) => r.id));
    return Object.keys(rowSelection).filter((id) => rowSelection[id] && existing.has(id));
  }, [rowSelection, data]);

  const statusFilter = (columnFilters.find((f) => f.id === "status")?.value as string | undefined) ?? "all";
  const tagFilter = (columnFilters.find((f) => f.id === "tags")?.value as string | undefined) ?? "all";
  const setFilter = (id: string, value: string) => {
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== id),
      ...(value === "all" ? [] : [{ id, value }]),
    ]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const filteredRows = table.getFilteredRowModel().rows;
  const pageRows = table.getRowModel().rows;
  const pageCount = Math.max(1, table.getPageCount());
  const hasFilters = Boolean(globalFilter) || columnFilters.length > 0;

  const exportRows = (rows: ClientRow[], name: string) => {
    const csv = toCsv(rows, [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Status", value: (r) => clientStatusMeta[r.status].label },
      { header: "Tags", value: (r) => r.tags.join("; ") },
      { header: "Visits", value: (r) => r.visits },
      { header: "Lifetime value", value: (r) => r.spent },
      {
        header: "Last visit",
        value: (r) => (r.lastVisit ? format(new Date(r.lastVisit), "yyyy-MM-dd") : ""),
      },
      { header: "Client since", value: (r) => format(new Date(r.createdAt), "yyyy-MM-dd") },
    ]);
    downloadCsv(`${name}-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
    toast.success(`Exported ${rows.length} clients`);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const ids = pendingDelete;
    setPendingDelete(null);
    const ok = await deleteClients(ids);
    if (!ok) return;
    setRowSelection({});
    toast.success(ids.length === 1 ? "Client deleted" : `${ids.length} clients deleted`);
  };

  const summary = useMemo(() => {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return {
      total: data.length,
      vip: data.filter((c) => c.status === "vip").length,
      newThisMonth: data.filter((c) => c.createdAt >= monthAgo).length,
      avgValue: data.length ? data.reduce((sum, c) => sum + c.spent, 0) / data.length : 0,
    };
  }, [data, now]);

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Everyone who has booked with you, with visit history and lifetime value."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportRows(
                  filteredRows.map((r) => r.original),
                  "clients",
                )
              }
              disabled={!filteredRows.length}
            >
              <DownloadIcon /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setClientDialogOpen(true)}>
              <UserPlusIcon /> Add client
            </Button>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total clients", summary.total.toLocaleString("en-US")],
          ["VIP clients", summary.vip.toLocaleString("en-US")],
          ["New in last 30 days", summary.newThisMonth.toLocaleString("en-US")],
          ["Avg. lifetime value", formatCurrency(Math.round(summary.avgValue), currency)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder="Search name, email or phone"
            aria-label="Search clients"
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger size="sm" className="w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {clientStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {clientStatusMeta[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={(v) => setFilter("tags", v)}>
            <SelectTrigger size="sm" className="w-36" aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setColumnFilters([]);
              }}
            >
              Reset <XIcon />
            </Button>
          ) : null}
        </div>
      </div>

      {selectedIds.length ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex animate-in flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2 text-sm fade-in slide-in-from-top-1"
        >
          <span className="font-medium">{selectedIds.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <TagIcon /> Add tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tag selected clients</DropdownMenuLabel>
                {tags.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onSelect={async () => {
                      const ok = await tagClients(selectedIds, t);
                      if (ok) toast.success(`Tagged ${selectedIds.length} clients as “${t}”`);
                    }}
                  >
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportRows(
                  data.filter((r) => selectedIds.includes(r.id)),
                  "clients-selected",
                )
              }
            >
              <DownloadIcon /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setPendingDelete(selectedIds)}
            >
              <Trash2Icon /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {clients.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No clients yet"
          description="Clients appear here automatically when they book, or you can add them yourself."
          action={
            <Button size="sm" onClick={() => setClientDialogOpen(true)}>
              <UserPlusIcon /> Add your first client
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn("text-xs text-muted-foreground", header.column.columnDef.meta?.className)}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {pageRows.length ? (
                pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => router.push(`/app/clients/${row.original.id}`)}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn("py-2.5", cell.column.columnDef.meta?.className)}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-40 text-center text-sm text-muted-foreground"
                  >
                    No clients match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              {filteredRows.length === data.length
                ? `${data.length} clients`
                : `${filteredRows.length} of ${data.length} clients`}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="hidden text-muted-foreground sm:inline">Rows</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}
                >
                  <SelectTrigger size="sm" className="w-18" aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-muted-foreground tabular-nums">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ClientDialog
        open={clientDialogOpen || Boolean(editing)}
        client={editing}
        onOpenChange={(open) => {
          if (!open) {
            setClientDialogOpen(false);
            setEditing(null);
          }
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.length === 1 ? "this client" : `${pendingDelete?.length} clients`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their notes and appointment history will be removed as well. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
