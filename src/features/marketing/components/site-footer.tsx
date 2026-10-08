import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { GlobeIcon } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Live booking page", href: `/book/${siteConfig.demoBookingSlug}` },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Hair & beauty salons", href: "/features#salons" },
      { label: "Clinics & therapists", href: "/features#clinics" },
      { label: "Consultants & coaches", href: "/features#consultants" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Online booking, calendar, clients and payments for service businesses that would rather be with
              their clients than in a spreadsheet.
            </p>
            <div className="flex items-center gap-1">
              <a
                href={siteConfig.links.github}
                aria-label="FlowDesk on GitHub"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href={siteConfig.author.url}
                aria-label="Ahmad Khajeh's website"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                <GlobeIcon className="size-4" />
              </a>
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 FlowDesk. All rights reserved.</p>
          <p>
            Demo project by Ahmad Khajeh —{" "}
            <a
              href={siteConfig.author.url}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              ahmadkhajeh.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
