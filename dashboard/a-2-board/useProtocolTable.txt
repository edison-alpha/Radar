import { useState } from 'react';
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
export function useProtocolTable(data, columns) {
  const [sorting, setSorting] = useState([{ id: 'implied_value_usd', desc: true }]);
  return useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => row.slug,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    autoResetPageIndex: true,
    enableSortingRemoval: false,
  });
}
