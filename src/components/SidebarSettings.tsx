import PlayerManager from "./PlayerManager";

export default function SidebarSettings() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 text-center">
      <div className="shrink-0 rounded-lg bg-rose-500 p-4 text-lg font-semibold text-white">
        Free Floor
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <PlayerManager />
      </div>
    </div>
  );
}
