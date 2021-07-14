import React from 'react';

import TableCell from '@material-ui/core/TableCell';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

import { DeleteButton, CellButton } from './buttons';
import { Row, Column } from './types';

interface PercentCellProps {
  row: Row;
  column: Column;
}

interface CellProps {
  row: Row;
  value: string;
  field: keyof Row;
  onBlur: (e: React.FocusEvent, row: Row) => void;
  onChange: (e: React.ChangeEvent, row: Row) => void;
  onClick: (id: Row['_id'], field: keyof Row) => void;
  error?: boolean;
  edited?: boolean;
}

export const Cell = React.memo((props: CellProps) => {
  const { row, value, field, onBlur, onClick, onChange, error = false, edited } = props;
  let content;

  const inputProps: TextFieldProps = {
    autoFocus: true,
    name: field,
    onBlur: e => onBlur(e, row),
    style: {
      maxWidth: 'fit-content',
      minWidth: '100%',
    },
    ...(field === 'gender' && {
      select: true,
      onChange: e => onChange(e, row),
      children: ['Муж.', 'Жен.'].map(gender => (
        <MenuItem key={gender} value={gender}>
          {gender}
        </MenuItem>
      )),
    }),
  };

  if (edited) {
    content = <TextField {...inputProps} defaultValue={value} />;
  } else if (value === null) {
    content = <TextField {...inputProps} />;
  } else {
    content = (
      <CellButton
        {...(field === 'name' && { align: 'left' })}
        onClick={() => onClick(row._id, field)}>
        <span style={error ? { borderBottom: '1px solid red' } : {}}>{value}</span>
      </CellButton>
    );
  }

  return <TableCell {...(field === 'name' && { align: 'left' })}>{content}</TableCell>;
});

export function PercentCell({ row, column }: PercentCellProps) {
  const hiNumber = Number(row.hi);
  return (
    <TableCell align='center'>
      {isNaN(hiNumber) || row.hi === null
        ? '-'
        : ((hiNumber * column.percent) / 100).toFixed(2)}
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
        <DeleteButton
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
        <CellButton onClick={onEdit}>{column.percent}%</CellButton>
      )}
    </TableCell>
  );
}
