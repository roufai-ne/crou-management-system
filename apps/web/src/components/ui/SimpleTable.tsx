/**
 * FICHIER: apps/web/src/components/ui/SimpleTable.tsx
 * COMPOSANT: SimpleTable - Composants de table composables
 *
 * DESCRIPTION:
 * Composants de table simples et composables basés sur les éléments HTML table
 * Pour une utilisation plus flexible que le composant Table data-driven
 *
 * USAGE:
 * <SimpleTable>
 *   <SimpleTableHeader>
 *     <SimpleTableRow>
 *       <SimpleTableHead>Nom</SimpleTableHead>
 *     </SimpleTableRow>
 *   </SimpleTableHeader>
 *   <SimpleTableBody>
 *     <SimpleTableRow>
 *       <SimpleTableCell>Valeur</SimpleTableCell>
 *     </SimpleTableRow>
 *   </SimpleTableBody>
 * </SimpleTable>
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

// Table principale
export interface SimpleTableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
  children: React.ReactNode;
}

export const SimpleTable = React.forwardRef<HTMLTableElement, SimpleTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
SimpleTable.displayName = 'SimpleTable';

// Header
export interface SimpleTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children: React.ReactNode;
}

export const SimpleTableHeader = React.forwardRef<HTMLTableSectionElement, SimpleTableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('border-b bg-gray-50 dark:bg-gray-800', className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);
SimpleTableHeader.displayName = 'SimpleTableHeader';

// Body
export interface SimpleTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children: React.ReactNode;
}

export const SimpleTableBody = React.forwardRef<HTMLTableSectionElement, SimpleTableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);
SimpleTableBody.displayName = 'SimpleTableBody';

// Footer
export interface SimpleTableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children: React.ReactNode;
}

export const SimpleTableFooter = React.forwardRef<HTMLTableSectionElement, SimpleTableFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn('border-t bg-gray-50 dark:bg-gray-800 font-medium', className)}
        {...props}
      >
        {children}
      </tfoot>
    );
  }
);
SimpleTableFooter.displayName = 'SimpleTableFooter';

// Row
export interface SimpleTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
  children: React.ReactNode;
}

export const SimpleTableRow = React.forwardRef<HTMLTableRowElement, SimpleTableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-800',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
SimpleTableRow.displayName = 'SimpleTableRow';

// Head cell
export interface SimpleTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children?: React.ReactNode;
}

export const SimpleTableHead = React.forwardRef<HTMLTableCellElement, SimpleTableHeadProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-gray-700 dark:text-gray-300 [&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
);
SimpleTableHead.displayName = 'SimpleTableHead';

// Cell
export interface SimpleTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children?: React.ReactNode;
}

export const SimpleTableCell = React.forwardRef<HTMLTableCellElement, SimpleTableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
        {...props}
      >
        {children}
      </td>
    );
  }
);
SimpleTableCell.displayName = 'SimpleTableCell';

// Namespace pattern pour permettre SimpleTable.Header, SimpleTable.Body, etc.
export const Table = Object.assign(SimpleTable, {
  Header: SimpleTableHeader,
  Body: SimpleTableBody,
  Footer: SimpleTableFooter,
  Row: SimpleTableRow,
  Head: SimpleTableHead,
  Cell: SimpleTableCell
});
