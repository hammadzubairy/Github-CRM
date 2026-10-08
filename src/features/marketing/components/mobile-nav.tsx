"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DemoLoginButton } from "@/features/auth/components/demo-login-button";
import { marketingNav } from "@/lib/site";

export default function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {item.title}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t pt-4">
            <Button asChild variant="outline">
              <Link href="/login" onClick={close}>
                Log in
              </Link>
            </Button>
            <DemoLoginButton>Try the demo</DemoLoginButton>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
