// Preview root. The site's sidebar uses plain links (<a href>); in this single-page preview they
// go through the router instead of loading a new page.
import { useEffect } from "react";
import { createRootRoute, Outlet, useRouter } from "@tanstack/react-router";

function Root() {
  const router = useRouter();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/") || a.target === "_blank") return;
      e.preventDefault();
      const [path, hash] = href.split("#");
      router.navigate({ to: path, hash: hash || undefined });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
  return <Outlet />;
}

export const Route = createRootRoute({ component: Root });
