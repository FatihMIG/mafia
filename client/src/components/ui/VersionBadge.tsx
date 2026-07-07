export function VersionBadge() {
  return (
    <div className="pointer-events-none fixed bottom-1 right-2 z-40 select-none text-[10px] text-mafia-muted opacity-50">
      v{__APP_VERSION__}
    </div>
  );
}
