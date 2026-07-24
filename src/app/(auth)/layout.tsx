import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <span className="cta-gradient flex size-8 items-center justify-center rounded-[10px] text-sm font-bold text-white">
          {siteConfig.shortName.slice(0, 1)}
        </span>
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
