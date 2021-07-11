import React from 'react';

import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';

import { DeleteBtn, MyButton } from './buttons';
import { Row, Column } from './types';

interface PercentCellProps {
  row: Row;
  column: Column;
}

export function PercentCell({ row, column }: PercentCellProps) {
  const hiNumber = Number(row.hi);
  return (
    <TableCell align='center'>
      {isNaN(hiNumber) || row.hi === null ? '-' : (hiNumber * column.percent) / 100}
    </TableCell>
  );
}

interface PercentHeaderProps {
  column: Column;
  edited: boolean;
  deletable: boolean;
  onEdit: React.MouseEventHandler;
  onDelete: React.MouseEventHandler;
  onUpdate: (value: string) => void;
}

export function PercentHeader(props: PercentHeaderProps) {
  const { column, edited, deletable, onEdit, onDelete, onUpdate } = props;
  return (
    <TableCell align='center' style={{ position: 'relative' }}>
      {deletable && (
        <DeleteBtn
          size='small'
          iconStyle={{ width: 20 }}
          style={{ position: 'absolute', right: -3, top: -5, zIndex: 10 }}
          onClick={onDelete}
        />
      )}
      {edited ? (
        <TextField
          autoFocus
          onBlur={e => onUpdate(e.target.value)}
          defaultValue={column.percent}
        />
      ) : (
        <MyButton onClick={onEdit}>{column.percent}%</MyButton>
      )}
    </TableCell>
  );
}
