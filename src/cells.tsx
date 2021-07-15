import React from 'react';

import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

import { DeleteButton, CellButton } from './buttons';
import { Row, Column } from './types';
import { callAll, cleanValue, cleanPercent } from './utils';

interface CellProps {
  row: Row;
  value: string;
  field: keyof Row;
  edited: boolean;
  onBlur: (e: React.FocusEvent, row: Row) => void;
  onChange: (e: React.ChangeEvent, row: Row) => void;
  onClick: (id: Row['_id'], field: keyof Row) => void;
}

export const Cell = React.memo((props: CellProps) => {
  const { row, value, field, edited, onBlur, onClick, onChange } = props;
  const [inputValue, setInputValue] = React.useState(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === 'hi') {
      if (
        !(
          value === '' ||
          value.match(/^\d{1,2}$/) ||
          value.match(/^\d{1,2}[.,]$/) ||
          value.match(/^\d{1,2}[.,]\d{1,2}$/)
        )
      ) {
        return;
      }
    }

    if (name === 'number') {
      if (!(value === '' || value.match(/^\d{1,6}$/))) {
        return;
      }
    }

    setInputValue(value);
  }

  return (
    <TableCell align={field === 'name' ? 'left' : 'center'}>
      {edited ? (
        <TextField
          autoFocus
          name={field}
          value={inputValue}
          onChange={callAll(handleChange, e => onChange(e, row))}
          onBlur={callAll(
            e => setInputValue(cleanValue(e.target.name as keyof Row, e.target.value)),
            e => onBlur(e, row)
          )}
          style={{ maxWidth: 'fit-content', minWidth: '100%' }}
          select={field === 'gender'}>
          {field === 'gender' &&
            ['Муж.', 'Жен.'].map(gender => (
              <MenuItem key={gender} value={gender}>
                {gender}
              </MenuItem>
            ))}
        </TextField>
      ) : (
        <CellButton
          align={field === 'name' ? 'left' : 'center'}
          onClick={() => onClick(row._id, field)}>
          {field === 'number' && value !== '' ? 'RU' + value : value}
        </CellButton>
      )}
    </TableCell>
  );
});

interface PercentCellProps {
  row: Row;
  column: Column;
}

export function PercentCell({ row, column }: PercentCellProps) {
  const hiNumber = Number(row.hi);
  return (
    <TableCell align='center'>
      {isNaN(hiNumber) || row.hi === ''
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
  const [inputValue, setInputValue] = React.useState(String(column.percent));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value } = e.target;

    if (
      !(
        value === '' ||
        value.match(/^\d{1,3}$/) ||
        value.match(/^\d{1,3}[.,]$/) ||
        value.match(/^\d{1,3}[.,]\d{1,2}$/)
      )
    ) {
      return;
    }

    setInputValue(value);
  }

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
          value={inputValue}
          onChange={handleChange}
          onBlur={callAll(
            e => setInputValue(cleanPercent(e.target.value)),
            e => onUpdate(cleanPercent(e.target.value))
          )}
        />
      ) : (
        <CellButton onClick={onEdit}>{column.percent}%</CellButton>
      )}
    </TableCell>
  );
}
