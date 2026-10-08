"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  StickyNoteIcon,
  Trash2Icon,
  UserXIcon,
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, initials } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useLookups, useScoped } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { StatusBadge } from "@/features/calendar/status";
import { EmptyState, PageContainer } from "@/features/dashboard/components/page-header";
import { buildClientRows } from "../stats";
import { ClientDialog } from "./client-dialog";
import { StatusPill } from "./clients-table";

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const business = useActiveBusiness();
  const clients = useScoped("clients");
  const appointments = useScoped("appointments");
  const notes = useScoped("notes");
  const { serviceById, staffById } = useLookups();
  const addNote = useAppStore((s) => s.addNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const deleteClients = useAppStore((s) => s.deleteClients);
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);
  const openEditAppointment = useUiStore((s) => s.openEditAppointment);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState("");
  const [now] = useState(() => new Date());
  const currency = business?.currency ?? "USD";

  const client = clients.find((c) => c.id === id);
  const history = useMemo(
    () => appointments.filter((a) => a.clientId === id).sort((a, b) => b.start.localeCompare(a.start)),
    [appointments, id],
  );
  const clientNotes = useMemo(
    () => notes.filter((n) => n.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, id],
  );
  const stats = useMemo(
    () => (client ? buildClientRows([client], history, now)[0] : null),
    [client, history, now],
  );

  if (!client || !stats) {
    return (
      <PageContainer>
        <EmptyState
          icon={UserXIcon}
          title="Client not found"
          description="This client may have been deleted, or belongs to another workspace."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/app/clients">
                <ArrowLeftIcon /> Back to clients
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const upcoming = history.filter((a) => new Date(a.start) >= now && a.status !== "cancelled");
  const past = history.filter((a) => new Date(a.start) < now);
  const favorite = (() => {
    const counts = new Map<string, number>();
    for (const a of past)
      if (a.status === "completed") counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? serviceById.get(top[0])?.name : undefined;
  })();

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const ok = await addNote(client.id, body);
    if (ok) toast.success("Note added");
  };

  const onDelete = async () => {
    setConfirmDelete(false);
    const ok = await deleteClients([client.id]);
    if (!ok) return;
    toast.success(`${client.name} deleted`);
    router.push("/app/clients");
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="bg-brand-gradient grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white">
            {initials(client.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{client.name}</h1>
              <StatusPill status={client.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Client since {format(new Date(client.createdAt), "MMMM yyyy")}
              {favorite ? ` · Usually books ${favorite}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openNewAppointment({ clientId: client.id })}>
            <CalendarPlusIcon /> Book
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline" aria-label="More actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {client.email ? (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${client.email}`}>
                    <MailIcon /> Send email
                  </a>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2Icon /> Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Lifetime value", formatCurrency(stats.spent, currency)],
          ["Visits", String(stats.visits)],
          ["No-shows", String(stats.noShows)],
          [
            "Last visit",
            stats.lastVisit
              ? formatDistanceToNowStrict(new Date(stats.lastVisit), { addSuffix: true })
              : "Never",
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Appointments ({history.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({clientNotes.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-3">
              <Card className="py-0">
                {history.length ? (
                  <ul className="divide-y">
                    {[...upcoming]
                      .reverse()
                      .concat(past)
                      .map((appt) => {
                        const service = serviceById.get(appt.serviceId);
                        const member = staffById.get(appt.staffId);
                        const start = new Date(appt.start);
                        const isUpcoming = start >= now;
                        return (
                          <li key={appt.id}>
                            <button
                              type="button"
                              onClick={() => openEditAppointment(appt)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                            >
                              <span className="w-14 shrink-0 text-center">
                                <span className="block text-[11px] font-medium text-muted-foreground uppercase">
                                  {format(start, "MMM")}
                                </span>
                                <span className="block text-lg leading-tight font-semibold tabular-nums">
                                  {format(start, "d")}
                                </span>
                              </span>
                              <span
                                className="size-8 w-1 shrink-0 rounded-full"
                                style={{ backgroundColor: service?.color }}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {service?.name}
                                  {isUpcoming ? (
                                    <span className="ml-2 text-xs font-normal text-primary">Upcoming</span>
                                  ) : null}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {format(start, "EEE, HH:mm")} · with {member?.name ?? "—"}
                                </span>
                              </span>
                              <span className="hidden sm:block">
                                <StatusBadge status={appt.status} />
                              </span>
                              <span className="w-16 text-right text-sm font-medium tabular-nums">
                                {formatCurrency(appt.price, currency)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <EmptyState
                    className="m-4"
                    icon={CalendarPlusIcon}
                    title="No appointments yet"
                    action={
                      <Button size="sm" onClick={() => openNewAppointment({ clientId: client.id })}>
                        Book first appointment
                      </Button>
                    }
                  />
                )}
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-3 space-y-3">
              <form onSubmit={submitNote} className="rounded-xl border bg-card p-3">
                <label htmlFor="new-note" className="sr-only">
                  New note
                </label>
                <Textarea
                  id="new-note"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a private note: preferences, formulas, allergies…"
                  rows={3}
                  maxLength={1000}
                  className="resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote(e);
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Only visible to your team</span>
                  <Button type="submit" size="sm" disabled={!draft.trim()}>
                    Add note
                  </Button>
                </div>
              </form>
              {clientNotes.length ? (
                <ul className="space-y-2">
                  {clientNotes.map((note) => (
                    <li key={note.id} className="group rounded-xl border bg-card px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete note"
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={async () => {
                            const ok = await deleteNote(note.id);
                            if (ok) toast.success("Note deleted");
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {note.author} ·{" "}
                        {formatDistanceToNowStrict(new Date(note.createdAt), { addSuffix: true })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={StickyNoteIcon}
                  title="No notes yet"
                  description="Notes help your team remember what this client likes."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>How to reach {client.name.split(" ")[0]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:underline">
                  <MailIcon className="size-4 text-muted-foreground" /> {client.email}
                </a>
              ) : null}
              {client.phone ? (
                <a
                  href={`tel:${client.phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <PhoneIcon className="size-4 text-muted-foreground" /> {client.phone}
                </a>
              ) : null}
              {!client.email && !client.phone ? (
                <p className="text-muted-foreground">No contact details yet.</p>
              ) : null}
              {client.tags.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {client.tags.map((t) => (
                    <span key={t} className="rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Next appointment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {stats.nextVisit ? (
                <p>
                  <span className="font-medium">{format(new Date(stats.nextVisit), "EEEE d MMMM")}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    at {format(new Date(stats.nextVisit), "HH:mm")}
                  </span>
                </p>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground">Nothing booked.</p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openNewAppointment({ clientId: client.id })}
                  >
                    Book now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientDialog open={editing} onOpenChange={setEditing} client={client} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their notes and {history.length} appointments will be removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
