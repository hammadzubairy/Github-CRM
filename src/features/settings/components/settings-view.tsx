"use client";

import { useState } from "react";
import { BuildingIcon, ClockIcon, RotateCcwIcon, UserIcon, UsersRoundIcon } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";
import { BusinessSettings } from "./business-settings";
import { HoursSettings } from "./hours-settings";
import { ProfileSettings } from "./profile-settings";
import { SettingsCard } from "./settings-card";
import { TeamSettings } from "./team-settings";

const tabs = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "business", label: "Business", icon: BuildingIcon },
  { id: "team", label: "Team", icon: UsersRoundIcon },
  { id: "hours", label: "Working hours", icon: ClockIcon },
] as const;

type TabId = (typeof tabs)[number]["id"];

function initialTab(): TabId {
  const hash = window.location.hash.slice(1);
  return tabs.some((t) => t.id === hash) ? (hash as TabId) : "profile";
}

export function SettingsView() {
  const business = useActiveBusiness();
  const mode = useAppStore((s) => s.mode);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const [tab, setTab] = useState<TabId>(initialTab);

  if (!business) return null;

  const changeTab = (value: string) => {
    setTab(value as TabId);
    window.history.replaceState(null, "", `#${value}`);
  };

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Settings" description={`Manage your account and ${business.name}.`} />
      <Tabs value={tab} onValueChange={changeTab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="w-full justify-start border-b">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="flex-none px-3">
                <t.icon /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileSettings />
          {mode === "demo" ? (
            <SettingsCard
              tone="danger"
              title="Reset demo data"
              description="Restore both demo workspaces to a fresh set of clients, bookings and invoices. Changes you made in this browser will be lost."
              footer={
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <RotateCcwIcon /> Reset demo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Every change you made in this browser will be replaced with freshly generated demo
                        data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => {
                          resetDemo();
                          toast.success("Demo data reset");
                        }}
                      >
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              }
            >
              <p className="text-sm text-muted-foreground">
                Demo data lives only in this browser&apos;s local storage. Nothing is sent to a server.
              </p>
            </SettingsCard>
          ) : null}
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          <BusinessSettings key={business.id} business={business} />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamSettings />
        </TabsContent>
        <TabsContent value="hours" className="mt-6">
          <HoursSettings
            key={`${business.id}-${JSON.stringify(business.workingHours)}`}
            business={business}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
