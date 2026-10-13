import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="mx-auto max-w-[560px] py-20 text-center">
      <h1 className="text-[52px]">This experience took a detour</h1>
      <p className="tv-muted mt-3 text-[20px]">It may have been removed, or it isn't published yet.</p>
      <div className="mt-6 flex justify-center"><Link to="/travel" className="tv-btn">Back to Discover</Link></div>
    </div>
  );
}
