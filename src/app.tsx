import React from 'react';
import ReactDOM from 'react-dom';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';

import { AddButton, DeleteButton, RefreshButton } from './buttons';
import { Cell, PercentCell, PercentHeader } from './cells';
import { Row, Column, DBAction } from './types';
import { sum } from './utils';

type EditedCell = {
  id: Row['_id'] | Column['_id'] | null;
  field: string | null;
};

type TableState = {
  rows: Row[];
  columns: Column[];
  history: Row[];
  editedCell: EditedCell;
  status: 'idle' | 'loading';
};

type TableAction =
  | DBAction
  | { type: 'edit_cell'; payload: EditedCell }
  | { type: 'undo_row' };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'load': {
      return { ...state, ...action.payload, status: 'idle' };
    }
    case 'insert_row': {
      return { ...state, rows: [...state.rows, action.payload] };
    }
    case 'update_row': {
      const { _id, ...data } = action.payload;
      const rows = state.rows.map(row => (row._id === _id ? { ...row, ...data } : row));
      return { ...state, editedCell: { id: null, field: null }, rows };
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
      return { ...state, editedCell: { id: null, field: null }, columns };
    }
    case 'remove_column': {
      const columns = state.columns.filter(column => column._id !== action.payload);
      return { ...state, columns };
    }
    case 'edit_cell': {
      return { ...state, editedCell: action.payload };
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

const useTableStyles = makeStyles({
  container: {
    maxWidth: (props: any) => props.tableWidth + 25,
  },
  table: {
    width: (props: any) => props.tableWidth + 25,
  },
});

// TODO: ctrl+z in the same place where it was before.
// TODO: if user adds a new line and presses ctrl + z it is deleted.
// TODO: ctrl+z remove add column too.
// every action is ctrl+z attable.
// TODO: validation number and hi validation.
// TODO: ctrl + r to reload the whole thing.
// TODO: when aplication is launched refresh the data.
// TODO: display what shortcults and help message for new users.
// TODO: add ctr+f like in firefox.
function App() {
  const [state, dispatch] = React.useReducer(tableReducer, {
    rows: [],
    columns: [],
    history: [],
    editedCell: { id: null, field: null },
    status: 'loading',
  });

  const { rows, columns, editedCell, status } = state;
  const tableWidth = sum(columns.map(column => column.width));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const percentColumns = columns.filter(column => column.percent);
  const columnNames = ['number', 'name', 'gender', 'hi'] as Array<keyof Row>;

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

  function refresh() {
    console.log('Refreshing all');
  }

  function insertRow() {
    window.api.send('toMain', {
      type: 'insert_row',
      payload: createRow('', '', '', ''),
    });
  }

  function removeRow(rowID: Row['_id']) {
    window.api.send('toMain', { type: 'remove_row', payload: rowID });
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

  const updateRow = React.useCallback((row: Row, field: keyof Row, value: string) => {
    if (row[field] !== value) {
      window.api.send('toMain', {
        type: 'update_row',
        payload: { ...row, [field]: value.trim() },
      });
    } else {
      dispatch({ type: 'edit_cell', payload: { id: null, field: null } });
    }
  }, []);

  const handleClick = React.useCallback((id: Row['_id'], field: string | null) => {
    dispatch({ type: 'edit_cell', payload: { id, field } });
  }, []);

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>, row: Row) => {
      let { name, value } = e.target; // eslint-disable-line

      if (name === 'hi') {
        value = value.replace(',', '.');
      }

      if (value !== undefined) {
        updateRow(row, name as keyof Row, value);
      }
    },
    [updateRow]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: Row) => {
      const { value } = e.target;
      if (value !== undefined) {
        updateRow(row, 'gender', value);
      }
    },
    [updateRow]
  );

  const classes = useTableStyles({ tableWidth });

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TableContainer component={Paper} className={classes.container} ref={containerRef}>
        <Table size='small' className={classes.table}>
          <colgroup>
            {columns.map(column => (
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
              {percentColumns.map((column, i) => (
                <PercentHeader
                  key={column._id}
                  column={column}
                  deletable={i !== 0}
                  edited={editedCell.id === column._id && editedCell.field === null}
                  onEdit={() => handleClick(column._id, null)}
                  onUpdate={value => updateColumn(column._id, Number(value))}
                  onDelete={() => removeColumn(column._id)}
                />
              ))}
              <TableCell align='center'>
                <AddButton iconStyle={{ width: 29, height: 29 }} onClick={insertColumn} />
                <RefreshButton onClick={refresh} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row._id}>
                <TableCell align='center'>{i + 1}</TableCell>
                {columnNames.map(field => {
                  return (
                    <Cell
                      key={field}
                      row={row}
                      field={field as keyof Row}
                      value={row[field]}
                      edited={editedCell.id === row._id && editedCell.field === field}
                      onBlur={handleBlur}
                      onClick={handleClick}
                      onChange={handleChange}
                      error={isNaN(+row.hi) && row.hi !== '-'}
                    />
                  );
                })}
                {percentColumns.map(column => (
                  <PercentCell key={column._id} row={row} column={column} />
                ))}
                <TableCell align='center'>
                  <DeleteButton onClick={() => removeRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}
        className={classes.container}>
        <AddButton iconStyle={{ width: 35, height: 35 }} onClick={insertRow} />
      </div>
    </>
  );
}

function createRow(number: string, name: string, gender: string, hi: string) {
  return { number, name, gender, hi };
}

function createColumn(order: number, width: number, percent?: number) {
  return { order, width, ...(percent && { percent }) };
}

ReactDOM.render(<App />, document.getElementById('root'));
