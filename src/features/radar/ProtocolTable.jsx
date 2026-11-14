import React, { useMemo } from 'react';
import { Dropdown } from '../../components/ui/Dropdown';
import { SaveButton } from '../../components/ui/SaveButton';
import { ChainMark } from '../../components/ui/ChainMark';
import { TierBadge } from '../../components/ui/TierBadge';
import { flexRender } from '@tanstack/react-table';
import { useProtocolTable } from './useProtocolTable';
import { Icon } from '../../shared/Icon';
import { ProtocolMark, Growth, EmptyState, Button } from '../../shared/ui';
import { ageLabel, money } from '../../shared/format';
export function ProtocolTable({ rows, saved, onToggleSave, onSelect, onReset, savedView }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: '#',
        cell: ({ getValue }) => <span className="rank-cell">{getValue()}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Protocol',
        cell: ({ row }) => (
          <button className="protocol-cell" onClick={() => onSelect(row.original)}>
            <ProtocolMark name={row.original.name} slug={row.original.slug} />
            <span>
              <strong>{row.original.name}</strong>
              <small>
                {row.original.category ?? 'Uncategorised'} <span className="cell-dot">·</span>{' '}
                {row.original.chains[0] ?? 'Chain unreported'}
                {row.original.chains.length > 1 ? ` +${row.original.chains.length - 1}` : ''}
              </small>
            </span>
          </button>
        ),
      },
      {
        accessorKey: 'tier',
        header: 'Tier',
        meta: { hint: 'Watchlist, or outside the watchlist above or below the snapshot TVL floor' },
        cell: ({ getValue }) => <TierBadge tier={getValue()} />,
      },
      {
        accessorKey: 'tvl_usd',
        header: 'TVL',
        meta: { hint: 'Total value locked in the protocol' },
        cell: ({ getValue }) => money(getValue(), 2),
      },
      {
        accessorKey: 'change_7d',
        header: '7d change',
        meta: { hint: 'Change in TVL over the last seven days' },
        sortUndefined: 'last',
        cell: ({ getValue }) => <Growth value={getValue()} />,
      },
      {
        accessorKey: 'implied_value_usd',
        header: 'Estimated value',
        meta: { hint: 'Model estimate with a range based on comparable tokens; not a token price' },
        cell: ({ row }) => (
          <span className="implied-cell">
            <strong>{money(row.original.implied_value_usd, 2)}</strong>
            <small>
              {money(row.original.implied_low_usd)}–{money(row.original.implied_high_usd)}
            </small>
          </span>
        ),
      },
      {
        accessorKey: 'slice_per_1k_usd',
        header: 'Per $1k',
        meta: { hint: 'Illustrative allocation if depositors shared 10% of the launch pro rata; not an expected airdrop' },
        cell: ({ getValue }) => '$' + getValue().toFixed(2),
      },
      {
        id: 'farm',
        accessorFn: (row) => row.farm.fees_usd,
        header: 'Farm · fees · time',
        meta: {
          hint: 'Main action, cheapest chain, estimated fees and total time. Sorts by fees.',
        },
        cell: ({ row }) => (
          <span className="farm-cell">
            <strong>
              {row.original.farm.action} · <ChainMark chain={row.original.farm.chain} />{' '}
              {row.original.farm.chain}
            </strong>
            <small>
              ${row.original.farm.fees_usd.toFixed(2)} · {row.original.farm.minutes} min
            </small>
          </span>
        ),
      },
      {
        accessorKey: 'age_days',
        header: 'Tracked',
        meta: { hint: 'How long the protocol has been tracked' },
        cell: ({ getValue }) => <span className="muted">{ageLabel(getValue())}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="row-actions">
            <SaveButton
              saved={saved.has(row.id)}
              label={`${saved.has(row.id) ? 'Unsave' : 'Save'} ${row.original.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSave(row.id);
              }}
            />
            <button
              className="icon-button detail-button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(row.original);
              }}
              aria-label={`View ${row.original.name} details`}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
        ),
      },
    ],
    [onSelect, onToggleSave, saved],
  );
  const table = useProtocolTable(rows, columns);
  const pagination = table.getState().pagination;
  return (
    <div className="protocol-table-panel">
      <div className="table-scroll">
        <table className="protocol-table">
          <caption className="sr-only">
            Protocol rankings by estimated launch value. Select a protocol to view its valuation and
            research plan.
          </caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`col-${header.id}`}
                    scope="col"
                    aria-sort={
                      header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        title={header.column.columnDef.meta?.hint}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() ? (
                          <Icon
                            name="down"
                            size={12}
                            className={header.column.getIsSorted() === 'asc' ? 'rotate-180' : ''}
                          />
                        ) : (
                          <Icon name="sort" size={12} className="sort-icon" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="is-clickable" onClick={() => onSelect(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`col-${cell.column.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <EmptyState
          title={savedView ? 'Your research starts here' : undefined}
          description={
            savedView
              ? 'Save a protocol with the bookmark button to keep it in your research list.'
              : undefined
          }
          action={
            <Button onClick={onReset}>{savedView ? 'Browse protocols' : 'Clear filters'}</Button>
          }
        />
      )}
      <div className="table-pagination">
        <span>
          {rows.length
            ? `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, rows.length)}`
            : '0'}{' '}
          <span className="muted">of {rows.length} protocols</span>
        </span>
        <div>
          <Dropdown
            className="page-size"
            label="Rows per page"
            align="right"
            value={pagination.pageSize}
            onChange={(size) => table.setPageSize(Number(size))}
            options={[10, 20, 50].map((size) => ({ value: size, label: `${size} / page` }))}
          />
          <button
            className="icon-button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="Previous page"
          >
            <Icon name="chevron" className="rotate-180" size={16} />
          </button>
          <span className="page-number">
            {pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <button
            className="icon-button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="Next page"
          >
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
