import React from 'react';
import ReactDOM from 'react-dom';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell, { TableCellProps } from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

import { AddBtn, DeleteBtn, RefreshBtn, RestoreBtn, MyButton } from './buttons';
import { PercentCell, PercentHeader } from './cells';
import { Row, Column, DBAction } from './types';

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

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

// const defaultColumns = [
//   { _id: '1', width: 50 },
//   { _id: '2', width: 100 },
//   { _id: '3', width: 325 },
//   { _id: '4', width: 75 },
//   { _id: '5', width: 75 },
//   { _id: '6', width: 75, percent: 25 },
//   { _id: '7', width: 100 },
// ];

function App() {
  const [state, dispatch] = React.useReducer(tableReducer, {
    rows: [],
    columns: [],
    history: [],
    editedRow: { id: null, field: null },
  });

  const { rows, columns, editedRow } = state;
  const tableWidth = sum(columns.map(column => column.width));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const percentColumns = columns.filter(column => column.percent);

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

  React.useEffect(() => {
    containerRef.current?.scrollBy(1000, 0);
  }, [columns.length]);

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
    const row = rows.find(row => row._id === rowID);
    window.api.send('toMain', {
      type: 'update_row',
      payload: { ...row, [field]: value.trim() },
    });
  }

  function insertColumn() {
    const prevOrder = columns[columns.length - 2].order;
    window.api.send('toMain', {
      type: 'insert_column',
      payload: createColumn(prevOrder + 1, 75, 25),
    });
  }

  function updateColumn(columnID: Column['_id'], value: number) {
    const column = columns.find(column => column._id === columnID);
    window.api.send('toMain', {
      type: 'update_column',
      payload: { ...column, percent: value },
    });
    // dispatch({ type: 'update_column', payload: { ...column, percent: value } });
  }

  function removeColumn(columnID: Column['_id']) {
    window.api.send('toMain', { type: 'remove_column', payload: columnID });
    // dispatch({ type: 'remove_column', payload: columnID });
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, rowID: Row['_id']) {
    let { name, value } = e.target; // eslint-disable-line
    if (name === 'hi') {
      value = value.replace(',', '.');
    }
    if (value) {
      updateRow(rowID, name as keyof Row, value);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowID: Row['_id']
  ) {
    const { value } = e.target;
    if (value) updateRow(rowID, 'gender', value);
  }

  function handleClick(e: React.MouseEvent, rowID: Row['_id'], field: string | null) {
    dispatch({ type: 'edit_row', payload: { id: rowID, field } });
  }

  function renderCell(
    row: Row,
    field: keyof Row,
    cellProps: TableCellProps = {},
    inputProps: TextFieldProps = {},
    error = false
  ) {
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

    if (editedRow.id === row._id && editedRow.field === field) {
      content = (
        <TextField {...baseInputProps} {...inputProps} defaultValue={row[field]} />
      );
    } else if (row[field] === null) {
      content = <TextField {...baseInputProps} {...inputProps} />;
    } else {
      content = (
        <MyButton size='small' onClick={e => handleClick(e, row._id, field)}>
          <span style={error ? { borderBottom: '1px solid red' } : {}}>{row[field]}</span>
        </MyButton>
      );
    }

    return (
      <TableCell align='center' {...cellProps}>
        {content}
      </TableCell>
    );
  }

  const classes = makeStyles({
    container: {
      maxWidth: tableWidth + 25,
    },
    table: {
      width: tableWidth + 25,
    },
  })();

  return (
    <>
      {/* <pre>{JSON.stringify(columns, null, 1)}</pre> */}
      <div
        style={{ display: 'flex', justifyContent: 'flex-end' }}
        className={classes.container}>
        <RestoreBtn />
        <RefreshBtn
          title='Обновить всe'
          iconStyle={{ width: 35, height: 35 }}
          onClick={refreshAllRows}
        />
      </div>
      <TableContainer component={Paper} className={classes.container} ref={containerRef}>
        <Table size='small' className={classes.table}>
          <colgroup>
            {columns.map((column, i) => (
              <col key={i} width={column.width} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align='center'></TableCell>
              <TableCell align='center'>№</TableCell>
              <TableCell align='left'>Фамилия, &nbsp;Имя, &nbsp;Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              {percentColumns.map((column, i) => (
                <PercentHeader
                  key={i}
                  column={column}
                  deletable={i !== 0}
                  edited={editedRow.id === column._id && editedRow.field === null}
                  onEdit={e => handleClick(e, column._id, null)}
                  onUpdate={value => updateColumn(column._id, Number(value))}
                  onDelete={() => removeColumn(column._id)}
                />
              ))}
              <TableCell align='center'>
                <AddBtn iconStyle={{ width: 29, height: 29 }} onClick={insertColumn} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell align='center'>{i + 1}</TableCell>
                {renderCell(row, 'number')}
                {renderCell(row, 'name', { align: 'left' })}
                {renderCell(
                  row,
                  'gender',
                  {},
                  {
                    select: true,
                    onChange: e => handleChange(e, row._id),
                    children: ['Муж.', 'Жен.'].map(gender => (
                      <MenuItem key={gender} value={gender}>
                        {gender}
                      </MenuItem>
                    )),
                  }
                )}
                {renderCell(row, 'hi', null, null, isNaN(+row.hi) && row.hi !== '-')}
                {percentColumns.map((column, i) => (
                  <PercentCell key={i} row={row} column={column} />
                ))}
                <TableCell align='center'>
                  <RefreshBtn onClick={() => refreshRow(row._id)} />
                  <DeleteBtn onClick={() => removeRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}
        className={classes.container}>
        <AddBtn iconStyle={{ width: 35, height: 35 }} onClick={insertRow} />
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

function createColumn(order: number, width: number, percent?: number) {
  return { order, width, ...(percent && { percent }) };
}

ReactDOM.render(<App />, document.getElementById('root'));
