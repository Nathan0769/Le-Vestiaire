import type { CohortRow } from "@/types/admin-kpi";
import { COHORT_WEEKS } from "@/lib/admin/kpi-math";

// Paliers fixes plutôt qu'une opacité calculée : Tailwind ne génère que des classes écrites en entier
function cellClass(value: number) {
  if (value >= 0.6) return "bg-primary/60 text-primary-foreground";
  if (value >= 0.4) return "bg-primary/45";
  if (value >= 0.25) return "bg-primary/30";
  if (value >= 0.1) return "bg-primary/15";
  if (value > 0) return "bg-primary/5";
  return "";
}

export function formatWeek(week: string) {
  const [, month, day] = week.split("-");
  return `${day}/${month}`;
}

interface CohortTableProps {
  rows: CohortRow[];
  onCellClick?: (cohortWeek: string, offset: number) => void;
}

export function CohortTable({ rows, onCellClick }: CohortTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune inscription sur les 9 dernières semaines.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium p-2">Semaine</th>
            <th className="text-right font-medium p-2">Inscrits</th>
            {Array.from({ length: COHORT_WEEKS }, (_, k) => (
              <th key={k} className="text-center font-medium p-2">
                S+{k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohortWeek} className="border-t">
              <td className="p-2 whitespace-nowrap">{formatWeek(row.cohortWeek)}</td>
              <td className="p-2 text-right">{row.size}</td>
              {row.cells.map((value, k) => (
                <td key={k} className={`p-0 text-center ${value === null ? "" : cellClass(value)}`}>
                  {value !== null && value > 0 && onCellClick ? (
                    <button
                      type="button"
                      onClick={() => onCellClick(row.cohortWeek, k)}
                      className="w-full p-2 cursor-pointer hover:underline"
                    >
                      {Math.round(value * 100)} %
                    </button>
                  ) : (
                    <span className="block p-2">
                      {value === null ? "" : `${Math.round(value * 100)} %`}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
