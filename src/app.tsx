import React from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

import { AddBtn, DeleteBtn, RefreshBtn, RestoreBtn } from './buttons';
import { Row, Column, DBAction } from './types';

type EditedCell = {
  id: Row['_id'] | Column['_id'] | null;
  field: string | null;
};

type TableState = {
  rows: Row[];
  columns: Column[];
  history: Row[];
  editedRow: EditedCell;
};

type TableAction =
  | DBAction
  | { type: 'edit_row'; payload: EditedCell }
  | { type: 'undo_row' };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'load': {
      return { ...state, ...action.payload };
    }
    case 'insert_row': {
      return { ...state, rows: [...state.rows, action.payload] };
    }
    case 'update_row': {
      const { _id, ...data } = action.payload;
      const rows = state.rows.map(row => (row._id === _id ? { ...row, ...data } : row));
      return { ...state, editedRow: { id: null, field: null }, rows };
    }
    case 'remove_row': {
      const row = state.rows.find(row => row._id === action.payload);
      const newRows = state.rows.filter(row => row._id !== action.payload);
      return { ...state, rows: newRows, history: [...state.history, row] };
    }
    case 'insert_column': {
      const columns = state.columns.slice(0, -1);
      const last = state.columns.slice(-1);
      return { ...state, columns: [...columns, action.payload, ...last] };
    }
    case 'update_column': {
      const { _id, ...data } = action.payload;
      const columns = state.columns.map(column =>
        column._id === _id ? { ...column, ...data } : column
      );
      return { ...state, editedRow: { id: null, field: null }, columns };
    }
    case 'remove_column': {
      const columns = state.columns.filter(column => column._id !== action.payload);
      return { ...state, columns };
    }
    case 'edit_row': {
      return { ...state, editedRow: action.payload };
    }
    case 'undo_row': {
      return { ...state, history: state.history.slice(0, -1) };
    }
  }
}

function App() {
  const [state, dispatch] = React.useReducer(tableReducer, {
    rows: [],
    columns: [],
    history: [],
    editedRow: { id: null, field: null },
  });

  React.useEffect(() => {
    window.api.send('toMain', { type: 'load' });
    window.api.receive('fromMain', dispatch);
  }, []);

  React.useEffect(() => {
    function undoRow() {
      const lastRow = state.history.slice(-1)[0];
      window.api.send('toMain', { type: 'insert_row', payload: lastRow });
      dispatch({ type: 'undo_row' });
    }
    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.key === 'z' &&
        ((e.ctrlKey && window.platform !== 'darwin') ||
          (e.metaKey && window.platform === 'darwin'))
      ) {
        if (state.history.length) undoRow();
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.history]);

  function refreshAllRows() {
    console.log('Refreshing all');
  }

  function refreshRow(rowIndex: Row['_id']) {
    console.log(`Refreshing ${rowIndex}`);
  }

  function insertRow() {
    window.api.send('toMain', {
      type: 'insert_row',
      payload: createRow(null, null, null, null),
    });
  }

  function removeRow(rowID: Row['_id']) {
    window.api.send('toMain', { type: 'remove_row', payload: rowID });
  }

  function updateRow(rowID: Row['_id'], field: keyof Row, value: string) {
    const row = state.rows.find(row => row._id === rowID);
    window.api.send('toMain', {
      type: 'update_row',
      payload: { ...row, [field]: value.trim() },
    });
  }

  function insertColumn() {
    window.api.send('toMain', { type: 'insert_column', payload: createColumn(50, 25) });
  }

  function updateColumn(columnID: Column['_id'], value: number) {
    const column = state.columns.find(column => column._id === columnID);
    window.api.send('toMain', {
      type: 'update_column',
      payload: { ...column, percent: value },
    });
  }

  function removeColumn(columnID: Column['_id']) {
    window.api.send('toMain', { type: 'remove_column', payload: columnID });
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, rowID: Row['_id']) {
    const { name, value } = e.target;
    if (value) updateRow(rowID, name as keyof Row, value);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, rowID: Row['_id']) {
    const { value } = e.target;
    if (value) updateRow(rowID, 'gender', value);
  }

  function handleClick(e: React.MouseEvent, rowID: Row['_id'], field: string | null) {
    dispatch({ type: 'edit_row', payload: { id: rowID, field } });
  }

  function renderGenderCell(row: Row) {
    const inputProps: TextFieldProps = {
      autoFocus: true,
      select: true,
      style: {
        minWidth: '100%',
      },
      value: row.gender ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, row._id),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => handleBlur(e, row._id),
    };

    const options = ['Муж.', 'Жен.'].map(gender => (
      <MenuItem key={gender} value={gender}>
        {gender}
      </MenuItem>
    ));

    let content;
    if (state.editedRow.id === row._id && state.editedRow.field === 'gender') {
      content = <TextField {...inputProps}>{options}</TextField>;
    } else if (row.gender === null) {
      content = <TextField {...inputProps}>{options}</TextField>;
    } else {
      content = (
        <Button size='small' onClick={e => handleClick(e, row._id, 'gender')}>
          {row.gender}
        </Button>
      );
    }

    return <TableCell align='center'>{content}</TableCell>;
  }

  function renderCell(row: Row, field: keyof Row, cellProps = {}, inputProps = {}) {
    let content;

    const baseInputProps: TextFieldProps = {
      autoFocus: true,
      name: field,
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => handleBlur(e, row._id),
      style: {
        maxWidth: 'fit-content',
        minWidth: '100%',
      },
    };

    if (state.editedRow.id === row._id && state.editedRow.field === field) {
      content = (
        <TextField {...baseInputProps} {...inputProps} defaultValue={row[field]} />
      );
    } else if (row[field] === null) {
      content = <TextField {...baseInputProps} {...inputProps} />;
    } else {
      content = (
        <Button size='small' onClick={e => handleClick(e, row._id, field)}>
          {row[field]}
        </Button>
      );
    }

    return (
      <TableCell align='center' {...cellProps}>
        {content}
      </TableCell>
    );
  }

  function renderColumn(column: Column, i: number) {
    let content;

    if (state.editedRow.id == column._id && state.editedRow.field === null) {
      content = (
        <TextField
          onBlur={e => updateColumn(column._id, Number(e.target.value))}
          defaultValue={column.percent}
        />
      );
    } else {
      content = (
        <Button onClick={e => handleClick(e, column._id, null)}>{column.percent}%</Button>
      );
    }

    return (
      <TableCell align='center' style={{ position: 'relative' }} key={i}>
        {i !== 0 && (
          <DeleteBtn
            size='small'
            iconStyle={{ width: 20 }}
            style={{ position: 'absolute', right: -3, top: -5 }}
            onClick={() => removeColumn(column._id)}
          />
        )}
        {content}
      </TableCell>
    );
  }

  return (
    <>
      {/* <pre>{JSON.stringify(state, null, 1)}</pre> */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <RestoreBtn />
        <RefreshBtn
          title='Обновить всe'
          iconStyle={{ width: 35, height: 35 }}
          onClick={refreshAllRows}
        />
      </div>
      <br />
      <TableContainer component={Paper}>
        <Table size='small'>
          <colgroup>
            {state.columns.map(column => (
              <col key={column._id} width={column.width} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align='center'></TableCell>
              <TableCell align='center'>№</TableCell>
              <TableCell align='left'>Фамилия, &nbsp;Имя, &nbsp;Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              {state.columns.filter(column => 'percent' in column).map(renderColumn)}
              <TableCell align='center'>
                <AddBtn iconStyle={{ width: 29, height: 29 }} onClick={insertColumn} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell align='center'>{i + 1}</TableCell>
                {renderCell(row, 'number')}
                {renderCell(row, 'name', { align: 'left' })}
                {renderGenderCell(row)}
                {renderCell(row, 'hi', null)}
                {state.columns
                  .filter(column => 'percent' in column)
                  .map(({ percent }, i) => (
                    <TableCell align='center' key={i}>
                      {row.hi ? (row.hi * percent) / 100 : '-'}
                    </TableCell>
                  ))}
                <TableCell>
                  <RefreshBtn onClick={() => refreshRow(row._id)} />
                  <DeleteBtn onClick={() => removeRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddBtn iconStyle={{ width: 40, height: 40 }} onClick={insertRow} />
      </div>
    </>
  );
}

function createRow(
  number: number | null,
  name: string | null,
  gender: string | null,
  hi: number | null
) {
  return { number, name, gender, hi };
}

function createColumn(width: number, percent?: number) {
  return { width, ...(percent && { percent }) };
}

ReactDOM.render(<App />, document.getElementById('root'));
