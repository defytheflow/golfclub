import React from 'react';
import ReactDOM from 'react-dom';

import axios from 'axios';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Modal, { ModalProps } from '@material-ui/core/Modal';
import CircularProgress from '@material-ui/core/CircularProgress';

import { AddButton, DeleteButton, RefreshButton } from './buttons';
import { Cell, PercentCell, PercentHeader } from './cells';
import { Row, Column, User, DBAction } from './types';
import { cleanValue, sum, sortedIndex } from './utils';

type EditedCell = {
  id: Row['_id'] | Column['_id'] | null;
  field: string | null;
};

type HistoryEntry = (Row & { type: 'row' }) | (Column & { type: 'column' });

type TableState = {
  rows: Row[];
  columns: Column[];
  history: HistoryEntry[];
  fetching: Array<Row['_id']>;
  editedCell: EditedCell;
  status: 'idle' | 'loading';
  showHelp: boolean;
  user: User;
};

type TableAction =
  | DBAction
  | { type: 'edit_cell'; payload: EditedCell }
  | { type: 'undo' }
  | { type: 'show_help' }
  | { type: 'close_help' }
  | { type: 'fetch_row'; payload: Row['_id'] }
  | { type: 'fetch_rows'; payload: number }
  | { type: 'resolve_row'; payload: Row['_id'] }
  | { type: 'reject_row'; payload: Row['_id'] };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'load': {
      return {
        ...state,
        ...action.payload,
        status: 'idle',
        showHelp: action.payload.user.showHelp,
      };
    }
    case 'insert_row': {
      const index = sortedIndex(state.rows, action.payload, (a, b) => a.order - b.order);
      return {
        ...state,
        rows: [...state.rows.slice(0, index), action.payload, ...state.rows.slice(index)],
      };
    }
    case 'update_row': {
      const { _id, ...data } = action.payload;
      const rows = state.rows.map(row => (row._id === _id ? { ...row, ...data } : row));
      return { ...state, editedCell: { id: null, field: null }, rows };
    }
    case 'remove_row': {
      const rowIndex = state.rows.findIndex(row => row._id === action.payload);
      return {
        ...state,
        rows: [...state.rows.slice(0, rowIndex), ...state.rows.slice(rowIndex + 1)],
        history: [...state.history, { ...state.rows[rowIndex], type: 'row' }],
      };
    }
    case 'insert_column': {
      const index = sortedIndex(
        state.columns,
        action.payload,
        (a, b) => a.order - b.order
      );
      return {
        ...state,
        columns: [
          ...state.columns.slice(0, index),
          action.payload,
          ...state.columns.slice(index),
        ],
      };
    }
    case 'update_column': {
      const { _id, ...data } = action.payload;
      const columns = state.columns.map(column =>
        column._id === _id ? { ...column, ...data } : column
      );
      return { ...state, editedCell: { id: null, field: null }, columns };
    }
    case 'remove_column': {
      const columnIndex = state.columns.findIndex(
        column => column._id === action.payload
      );
      return {
        ...state,
        columns: [
          ...state.columns.slice(0, columnIndex),
          ...state.columns.slice(columnIndex + 1),
        ],
        history: [...state.history, { ...state.columns[columnIndex], type: 'column' }],
      };
    }
    case 'edit_cell': {
      return { ...state, editedCell: action.payload };
    }
    case 'undo': {
      return { ...state, history: state.history.slice(0, -1) };
    }
    case 'show_help': {
      return { ...state, showHelp: true };
    }
    case 'close_help': {
      return { ...state, showHelp: false };
    }
    case 'update_user': {
      return { ...state, user: action.payload };
    }
    case 'fetch_row': {
      return { ...state, fetching: [...state.fetching, action.payload] };
    }
    case 'fetch_rows': {
      return {
        ...state,
        fetching: state.rows.slice(0, action.payload).map(row => row._id),
      };
    }
    case 'resolve_row': {
      // do extra stuff.
      return { ...state, fetching: state.fetching.filter(id => id !== action.payload) };
    }
    case 'reject_row': {
      // do extra stuff.
      return { ...state, fetching: state.fetching.filter(id => id !== action.payload) };
    }
  }
}

const useTableStyles = makeStyles({
  container: {
    maxWidth: (props: { tableWidth: number }) => props.tableWidth + 25,
  },
  table: {
    width: (props: { tableWidth: number }) => props.tableWidth + 25,
  },
});

// TODO: add cancel refresh on second refresh click.
// TODO: horizontal scroll when a lot of columns.
// TODO: add ctr+f like in firefox.
// TODO: fix bug can not update fields while refreshing.
// TODO: fix empty rows shouuld not load and display spinner.
function App() {
  const [state, dispatch] = React.useReducer(tableReducer, {
    rows: [],
    columns: [],
    history: [],
    fetching: [],
    editedCell: { id: null, field: null },
    status: 'loading',
    showHelp: false,
    user: { showHelp: false },
  });

  const { rows, columns, fetching, editedCell, status, showHelp, user } = state;
  const tableWidth = sum(columns.map(column => column.width));
  const percentColumns = columns.filter(column => 'percent' in column);
  const columnNames = ['number', 'name', 'gender', 'hi'] as Array<
    Exclude<keyof Row, 'order'>
  >;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const runScrollEffectRef = React.useRef(false);
  const removedRowInProcessRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    window.api.send('toMain', { type: 'load' });
    window.api.receive('fromMain', dispatch);
  }, []);

  React.useEffect(() => {
    function undo() {
      const lastEntry = state.history.slice(-1)[0];

      if (lastEntry.type === 'row') {
        delete lastEntry.type;
        window.api.send('toMain', { type: 'insert_row', payload: lastEntry });
      } else if (lastEntry.type === 'column') {
        delete lastEntry.type;
        window.api.send('toMain', { type: 'insert_column', payload: lastEntry });
      }

      dispatch({ type: 'undo' });
    }

    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.key === 'z' &&
        ((e.ctrlKey && window.platform !== 'darwin') ||
          (e.metaKey && window.platform === 'darwin'))
      ) {
        if (state.editedCell.id === null && state.history.length) undo();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.editedCell.id, state.history]);

  React.useEffect(() => {
    if (columns.length) {
      if (runScrollEffectRef.current) {
        containerRef.current?.scrollBy(1000, 0);
      }
      runScrollEffectRef.current = true;
    }
  }, [columns.length]);

  async function refresh() {
    const count = rows.length;
    dispatch({ type: 'fetch_rows', payload: count });

    // super cool errors cna happen here...
    const parser = new DOMParser();
    const res = await axios.get('https://hcp.rusgolf.ru/public/player/ru/');
    const html = parser.parseFromString(res.data, 'text/html');
    const csrfToken = (html.querySelector('#form__token') as HTMLInputElement).value;

    // console.time('timer');
    for (const row of rows.slice(0, count)) {
      // dispatch({ type: 'fetch_row', payload: row._id });
      if (!row.number) {
        return;
      }

      axios
        .get('https://hcp.rusgolf.ru/public/player/ru/', {
          params: {
            'form[search]': 'RU' + row.number,
            'form[_token]': csrfToken,
          },
        })
        .then(res => {
          const html = parser.parseFromString(res.data, 'text/html');
          const trs = html.querySelectorAll('tr');
          const tr = trs.length === 2 ? trs[1] : null;
          if (tr) {
            const tds = tr.querySelectorAll('td');
            const number = tds[0].innerText.trim().substr(2);
            const name = tds[1].innerText.replace('.', '').trim();
            const gender = tds[2].innerText.trim();

            let hi = tds[3].innerText.trim().replace(',', '.');
            hi = hi === '-' ? hi : Number(hi).toFixed(2);

            window.api.send('toMain', {
              type: 'update_row',
              payload: { ...row, number, name, gender, hi },
            });

            dispatch({ type: 'resolve_row', payload: row._id });
            // console.log(tr.innerText.replace(/\s+/g, ''));
          } else {
            dispatch({ type: 'reject_row', payload: row._id });
          }
        })
        .catch(err => {
          if (axios.isAxiosError(err)) {
            dispatch({ type: 'reject_row', payload: row._id });
          }
        });
    }
  }

  function insertRow() {
    const prevOrder = rows[rows.length - 1].order;
    window.api.send('toMain', {
      type: 'insert_row',
      payload: createRow(prevOrder + 1, '', '', '', ''),
    });
  }

  function removeRow(rowID: Row['_id']) {
    if (removedRowInProcessRef.current === rowID) {
      return;
    }
    window.api.send('toMain', { type: 'remove_row', payload: rowID });
    removedRowInProcessRef.current = rowID;
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

    if (column.percent !== value) {
      window.api.send('toMain', {
        type: 'update_column',
        payload: { ...column, percent: value },
      });
    } else {
      dispatch({ type: 'edit_cell', payload: { id: null, field: null } });
    }
  }

  function removeColumn(columnID: Column['_id']) {
    window.api.send('toMain', { type: 'remove_column', payload: columnID });
  }

  const updateRow = React.useCallback((row: Row, field: keyof Row, value: string) => {
    if (row[field] !== value) {
      window.api.send('toMain', {
        type: 'update_row',
        payload: { ...row, [field]: cleanValue(field, value) },
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
      const { name, value } = e.target;
      if (value !== undefined) {
        updateRow(row, name as keyof Row, value);
      }
    },
    [updateRow]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: Row) => {
      const { name, value } = e.target;
      if (name === 'gender' && value !== undefined) {
        updateRow(row, 'gender', value);
      }
    },
    [updateRow]
  );

  const classes = useTableStyles({ tableWidth });

  if (status === 'loading') {
    return (
      <div style={{ padding: '0 2rem' }}>
        <h1>Загрузка...</h1>
      </div>
    );
  }

  return (
    <>
      <HelpModal
        open={showHelp}
        onClose={() => dispatch({ type: 'close_help' })}
        onInputChange={value => {
          window.api.send('toMain', {
            type: 'update_user',
            payload: { ...user, showHelp: !value },
          });
          dispatch({ type: 'close_help' });
        }}
        checked={!user.showHelp}
      />
      <div style={{ display: 'flex' }}>
        <ul
          style={{
            listStyleType: 'none',
            padding: 0,
            marginTop: 52,
            width: 40,
          }}>
          {rows.map(row => {
            const isFetching = fetching.some(id => id === row._id);
            const isAnyFetching = fetching.length > 0;

            if (isFetching) {
              return (
                <li
                  key={row._id}
                  style={{
                    height: 45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.5rem',
                    marginLeft: '0.5rem',
                  }}>
                  <CircularProgress style={{ height: 15, width: 15 }} />
                </li>
              );
            }

            if (isAnyFetching) {
              return (
                <li
                  key={row._id}
                  style={{
                    height: 45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.5rem',
                    marginLeft: '0.5rem',
                  }}></li>
              );
            }

            return null;
          })}
        </ul>
        <TableContainer
          component={Paper}
          className={classes.container}
          ref={containerRef}>
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
                  <AddButton
                    iconStyle={{ width: 29, height: 29 }}
                    onClick={insertColumn}
                  />
                  <RefreshButton onClick={refresh} />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const isRowDisabled = fetching.some(id => id === row._id);
                return (
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
                          disabled={isRowDisabled}
                          onBlur={handleBlur}
                          onClick={handleClick}
                          onChange={handleChange}
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}
        className={classes.container}>
        <AddButton iconStyle={{ width: 35, height: 35 }} onClick={insertRow} />
      </div>
    </>
  );
}

interface HelpModalProps extends Omit<ModalProps, 'children'> {
  checked: boolean;
  onInputChange: (value: boolean) => void;
}

function HelpModal({ checked, onInputChange, onClose, ...rest }: HelpModalProps) {
  const [isChecked, setChecked] = React.useState(checked);
  return (
    <Modal
      {...rest}
      onClose={(event, reason) => {
        if (isChecked !== checked) {
          onInputChange(isChecked);
        }
        onClose(event, reason);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <div
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 5,
          outline: 0,
        }}>
        <h1>Инструкция</h1>
        <p>...</p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
          <input
            id='show-help'
            type='checkbox'
            onChange={e => setChecked(e.target.checked)}
            checked={isChecked}
          />
          <label htmlFor='show-help'>Больше не показывать</label>
        </div>
      </div>
    </Modal>
  );
}

function createRow(
  order: number,
  number: string,
  name: string,
  gender: string,
  hi: string
) {
  return { order, number, name, gender, hi };
}

function createColumn(order: number, width: number, percent?: number) {
  return { order, width, ...(percent && { percent }) };
}

ReactDOM.render(<App />, document.getElementById('root'));
