import React from 'react';
import ReactDOM from 'react-dom';

import axios, { CancelTokenSource } from 'axios';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import WarningIcon from '@material-ui/icons/Warning';

import {
  AddButton,
  CancelButton,
  ClearButton,
  DeleteButton,
  RefreshButton,
} from './buttons';
import { Cell, PercentCell, PercentHeader } from './cells';
import { ErrorModal, HelpModal } from './modals';
import { Row, Column, User, DBAction } from './types';
import {
  cleanValue,
  sum,
  sortedIndex,
  createRow,
  createColumn,
  // useReducerLogger,
} from './utils';

type EditedCell = {
  id: Row['_id'] | Column['_id'] | null;
  field: string | null;
};

type HistoryEntry = (Row & { type: 'row' }) | (Column & { type: 'column' });

type ModalState = {
  type: null | 'help' | 'error';
  message?: string;
};

type FetchingEntry = {
  id: Row['_id'];
  status: 'loading' | 'error';
};

type TableState = {
  rows: Row[];
  columns: Column[];
  history: HistoryEntry[];
  fetching: FetchingEntry[];
  editedCell: EditedCell;
  status: 'idle' | 'loading';
  modal: ModalState;
  user: User;
};

type TableAction =
  | DBAction
  | { type: 'edit_cell'; payload: EditedCell }
  | { type: 'undo' }
  | { type: 'open_modal'; payload: ModalState }
  | { type: 'close_modal' }
  | { type: 'fetch_row'; payload: Row['_id'] }
  | { type: 'fetch_rows'; payload: number }
  | { type: 'resolve_row'; payload: Row['_id'] }
  | { type: 'resolve_rows' }
  | { type: 'reject_row'; payload: Row['_id'] }
  | { type: 'reject_rows' };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'load': {
      return {
        ...state,
        ...action.payload,
        status: 'idle',
        modal: action.payload?.user.showHelp ? { type: 'help' } : state.modal,
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
      const editedCell =
        _id === state.editedCell.id ? { id: null, field: null } : state.editedCell;
      return { ...state, editedCell, rows };
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
    case 'open_modal': {
      return { ...state, modal: action.payload };
    }
    case 'close_modal': {
      return { ...state, modal: { type: null } };
    }
    case 'update_user': {
      return { ...state, user: action.payload };
    }
    case 'fetch_row': {
      return {
        ...state,
        fetching: [...state.fetching, { id: action.payload, status: 'loading' }],
      };
    }
    case 'fetch_rows': {
      return {
        ...state,
        fetching: state.rows
          .slice(0, action.payload)
          .filter(row => row.number)
          .map(row => ({ id: row._id, status: 'loading' })),
      };
    }
    case 'resolve_row': {
      return {
        ...state,
        fetching: state.fetching.filter(entry => entry.id !== action.payload),
      };
    }
    case 'resolve_rows': {
      return { ...state, fetching: [] };
    }
    case 'reject_row': {
      const index = state.fetching.findIndex(entry => entry.id === action.payload);
      return {
        ...state,
        fetching: [
          ...state.fetching.slice(0, index),
          { ...state.fetching[index], status: 'error' },
          ...state.fetching.slice(index + 1),
        ],
      };
    }
    case 'reject_rows': {
      return {
        ...state,
        fetching: [],
        modal: { type: 'error', message: 'Сайт недоступен' },
      };
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

// TODO: horizontal scroll when a lot of columns.
function App() {
  const [state, dispatch] =
    // useReducerLogger(
    React.useReducer(tableReducer, {
      rows: [],
      columns: [],
      history: [],
      fetching: [],
      editedCell: { id: null, field: null },
      status: 'loading',
      modal: { type: null, message: '' },
      user: { showHelp: false },
    });
  // );

  const { rows, columns, fetching, editedCell, status, modal, user } = state;
  const tableWidth = sum(columns.map(column => column.width));
  const percentColumns = columns.filter(column => 'percent' in column);
  const columnNames: Exclude<keyof Row, 'order'>[] = ['number', 'name', 'gender', 'hi'];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const runScrollEffectRef = React.useRef(false);
  const removedRowInProcessRef = React.useRef<string | null>(null);
  const cancelTokenRef = React.useRef<CancelTokenSource | null>(null);

  React.useEffect(() => {
    window.api.send('toMain', { type: 'load' });
    window.api.receive('fromMain', dispatch);
  }, []);

  React.useEffect(() => {
    function undo() {
      const lastEntry = state.history.slice(-1)[0];

      if (lastEntry.type === 'row') {
        const { type: _, ...lastRow } = lastEntry; // eslint-disable-line
        window.api.send('toMain', { type: 'insert_row', payload: lastRow });
      } else if (lastEntry.type === 'column') {
        const { type: _, ...lastColumn } = lastEntry; // eslint-disable-line
        window.api.send('toMain', { type: 'insert_column', payload: lastColumn });
      }

      dispatch({ type: 'undo' });
    }

    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.key === 'z' &&
        ((e.ctrlKey && window.platform !== 'darwin') ||
          (e.metaKey && window.platform === 'darwin'))
      ) {
        if (editedCell.id === null && state.history.length) undo();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [editedCell.id, state.history]);

  React.useEffect(() => {
    if (columns.length) {
      if (runScrollEffectRef.current) {
        containerRef.current?.scrollBy(1000, 0);
      }
      runScrollEffectRef.current = true;
    }
  }, [columns.length]);

  async function refresh() {
    // const count = 10;
    const count = state.rows.length;
    dispatch({ type: 'fetch_rows', payload: count });

    const parser = new DOMParser();
    let csrfToken: string | null = null;

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const res = await axios.get('https://hcp.rusgolf.ru/public/player/ru/', {
        cancelToken: cancelTokenRef.current.token,
      });
      const html = parser.parseFromString(res.data, 'text/html');
      const tokenInput = html.querySelector('#form__token') as HTMLInputElement | null;
      if (tokenInput) {
        csrfToken = tokenInput.value;
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        dispatch({ type: 'resolve_rows' });
      } else {
        console.error(err.message);
        dispatch({ type: 'reject_rows' });
      }
      return;
    }

    if (!csrfToken) {
      console.error("Couldn't find a csrf token element on the page.");
      dispatch({ type: 'reject_rows' });
      return;
    }

    let hasBeenCancelled = false;
    for (const row of rows.slice(0, count)) {
      if (!row.number) {
        return;
      }
      axios
        .get('https://hcp.rusgolf.ru/public/player/ru/', {
          params: {
            'form[search]': 'RU' + row.number,
            'form[_token]': csrfToken,
          },
          cancelToken: cancelTokenRef.current.token,
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
          } else {
            dispatch({ type: 'reject_row', payload: row._id });
          }
        })
        .catch(err => {
          if (axios.isCancel(err)) {
            if (!hasBeenCancelled) {
              dispatch({ type: 'resolve_rows' });
              hasBeenCancelled = true;
            }
          } else {
            console.error(err.message);
            dispatch({ type: 'reject_rows' });
          }
        });
    }
  }

  function insertRow() {
    const prevOrder = rows.length > 0 ? rows[rows.length - 1].order : 0;
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
    removedRowInProcessRef.current = rowID as string;
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

    if (column && column.percent !== value) {
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

  const isFetching = fetching.some(entry => entry.status === 'loading');
  const isError = fetching.some(entry => entry.status === 'error');

  return (
    <>
      <HelpModal
        open={modal.type === 'help'}
        onClose={() => dispatch({ type: 'close_modal' })}
        defaultChecked={!user.showHelp}
        onCheck={value => {
          // prettier-ignore
          window.api.send('toMain', { type: 'update_user', payload: { ...user, showHelp: !value } });
          dispatch({ type: 'close_modal' });
        }}
      />
      <ErrorModal
        open={modal.type === 'error'}
        onClose={() => dispatch({ type: 'close_modal' })}
        message={modal.message as string}
      />
      {!isFetching && isError && (
        <ClearButton
          style={{
            position: 'absolute',
            top: '2.55rem',
            left: '0.2rem',
          }}
          onClick={() => dispatch({ type: 'resolve_rows' })}
        />
      )}
      <div style={{ display: 'flex' }}>
        <LoadingBar rows={rows} fetching={fetching} />
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
                  {isFetching ? (
                    <CancelButton onClick={() => cancelTokenRef.current?.cancel()} />
                  ) : (
                    <RefreshButton onClick={refresh} />
                  )}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const isRowDisabled = fetching.some(
                  entry => entry.id === row._id && entry.status === 'loading'
                );
                return (
                  <TableRow key={row._id}>
                    <TableCell align='center'>{i + 1}</TableCell>
                    {columnNames.map(field => {
                      return (
                        <Cell
                          key={field}
                          row={row}
                          field={field as keyof Row}
                          value={row[field] as string}
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
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '0.5rem',
          marginLeft: 40,
        }}
        className={classes.container}>
        <AddButton iconStyle={{ width: 35, height: 35 }} onClick={insertRow} />
      </div>
    </>
  );
}

const useLoadingBarStyles = makeStyles({
  root: {
    listStyleType: 'none',
    padding: 0,
    marginTop: 55,
    width: 40,
  },
  item: {
    height: 47,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '0.5rem',
    marginLeft: '0.5rem',
  },
});

function LoadingBar({ rows, fetching }: Pick<TableState, 'rows' | 'fetching'>) {
  const classes = useLoadingBarStyles();
  return (
    <ul className={classes.root}>
      {rows.map(row => {
        const entry = fetching.find(entry => entry.id === row._id);

        const isLoading = entry?.status === 'loading';
        const isError = entry?.status === 'error';
        const isAnyLoadingOrError = fetching.length > 0;

        if (!(isLoading || isError || isAnyLoadingOrError)) {
          return null;
        }

        return (
          <li key={row._id} className={classes.item}>
            {isLoading ? (
              <CircularProgress style={{ height: 15, width: 15 }} />
            ) : isError ? (
              <Tooltip title='Не найден'>
                <WarningIcon style={{ height: 20, width: 20, color: 'orange' }} />
              </Tooltip>
            ) : (
              <React.Fragment />
            )}
          </li>
        );
      })}
    </ul>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
