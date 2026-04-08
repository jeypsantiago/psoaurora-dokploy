import React from "react";
import { ShieldCheck } from "lucide-react";

const SkeletonBlock: React.FC<{
  className?: string;
}> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 ${className}`} />
);

export const SecureWorkspaceBootstrap: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,#fafafa_0%,#f4f7fb_55%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#050505_0%,#090909_55%,#030303_100%)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-black/30 lg:flex lg:flex-col">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-2 h-5 w-40" />
            </div>
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
          </div>

          <div className="mt-auto space-y-3 pt-6">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-black/30">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="mt-2 h-6 w-64 max-w-full" />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <SkeletonBlock className="h-10 w-24 rounded-full" />
                <SkeletonBlock className="h-10 w-10 rounded-full" />
                <SkeletonBlock className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </header>

          <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SkeletonBlock className="h-28 w-full" />
                <SkeletonBlock className="h-28 w-full" />
                <SkeletonBlock className="h-28 w-full sm:col-span-2 xl:col-span-1" />
              </div>
              <SkeletonBlock className="h-64 w-full" />
              <SkeletonBlock className="h-80 w-full" />
            </div>

            <div className="space-y-5">
              <SkeletonBlock className="h-48 w-full" />
              <SkeletonBlock className="h-56 w-full" />
              <SkeletonBlock className="h-40 w-full" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SecureWorkspaceBootstrap;
