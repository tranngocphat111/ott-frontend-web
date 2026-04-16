import EmptyState from "./EmptyState";

interface Column<T extends object> {
  key: keyof T;
  label: string;
}

interface AdminTableProps<T extends object> {
  columns: Array<Column<T>>;
  rows: T[];
}

function AdminTable<T extends object>({ columns, rows }: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-slate-100 hover:bg-slate-50"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-4 py-3 text-slate-700"
                >
                  {String((row[column.key] as unknown) ?? "-")}
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
