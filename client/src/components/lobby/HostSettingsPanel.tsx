import type { RoomSettings } from "@wolf/shared";
import { updateSettings } from "../../state/actions";
import { Input } from "../ui/Input";

interface Props {
  settings: RoomSettings;
}

export function HostSettingsPanel({ settings }: Props) {
  return (
    <div className="nes-container is-rounded space-y-3 bg-mafia-panel2 text-mafia-text">
      <h3 className="text-sm font-semibold text-mafia-muted">Host Settings</h3>

      <div className="grid grid-cols-3 gap-3">
        <TimerField
          label="Night (s)"
          value={settings.nightDurationSec}
          onChange={(v) => updateSettings({ nightDurationSec: v })}
        />
        <TimerField
          label="Day (s)"
          value={settings.dayDurationSec}
          onChange={(v) => updateSettings({ dayDurationSec: v })}
        />
        <TimerField
          label="Voting (s)"
          value={settings.votingDurationSec}
          onChange={(v) => updateSettings({ votingDurationSec: v })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-mafia-muted">
        <input
          type="checkbox"
          className="nes-checkbox"
          checked={settings.isPublic}
          onChange={(e) => updateSettings({ isPublic: e.target.checked })}
        />
        <span>Public room (listed in browse)</span>
      </label>

      <label className="flex items-center gap-2 text-sm text-mafia-muted">
        Mafia count override
        <Input
          type="number"
          min={0}
          max={8}
          className="w-28"
          value={settings.mafiaCountOverride ?? ""}
          placeholder="auto"
          onChange={(e) =>
            updateSettings({ mafiaCountOverride: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </label>
    </div>
  );
}

function TimerField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-mafia-muted">
      {label}
      <Input type="number" min={10} max={300} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
