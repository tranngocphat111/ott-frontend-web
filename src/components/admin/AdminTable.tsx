import type { ReactNode } from "react";
import EmptyState from "./EmptyState";

interface Column<T extends object> {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T extends object> {
  columns: Array<Column<T>>;
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
}

function AdminTable<T extends object>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${column.headerClassName ?? ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-5 py-4 align-top text-slate-700 ${column.className ?? ""}`}
                >
                  {column.render
                    ? column.render(row)
                    : String((row[column.key] as unknown) ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminTable;
