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
import { IPCMainMessage, Row } from './types';

const genders = [
  {
    label: 'Муж.',
    value: 'Муж.',
  },
  {
    label: 'Жен.',
    value: 'Жен.',
  },
];

type EditRow = {
  id: Row['_id'] | null;
  field: string | null;
};

type TableState = {
  rows: Row[];
  widths: number[];
  percents: number[];
  editRow: EditRow;
};

type TableAction =
  | { type: 'set_rows'; payload: Row[] }
  | { type: 'add_row'; payload: Row }
  | { type: 'delete_row'; payload: Row['_id'] }
  | { type: 'update_row'; payload: Row }
  | { type: 'edit_row'; payload: EditRow }
  | { type: 'add_percent' }
  | { type: 'delete_percent'; payload: number };

// TODO: change widths. makew widths static. add gorizontal scrollbar.
// TODO: Ctrl + z for rows deletions.
function App() {
  const [state, dispatch] = React.useReducer(
    (state: TableState, action: TableAction) => {
      switch (action.type) {
        case 'set_rows': {
          return { ...state, rows: action.payload };
        }
        case 'add_row': {
          const newRows = [...state.rows, action.payload];
          return { ...state, rows: newRows };
        }
        case 'delete_row': {
          const newRows = state.rows.filter(row => row._id !== action.payload);
          return { ...state, rows: newRows };
        }
        case 'update_row': {
          const { _id, ...data } = action.payload;
          const newRows = state.rows.slice();
          const rowIndex = newRows.findIndex(row => row._id === _id);
          newRows[rowIndex] = { ...newRows[rowIndex], ...data };
          return { ...state, editRow: { id: null, field: null }, rows: newRows };
        }
        case 'edit_row': {
          return { ...state, editRow: action.payload };
        }
        case 'add_percent': {
          const newPercents = [...state.percents, 5];
          const lastWidth = state.widths[state.widths.length - 1];
          const newWidths = [...state.widths.slice(0, -1), 25, lastWidth];
          return { ...state, percents: newPercents, widths: newWidths };
        }
        case 'delete_percent': {
          const newPercents = state.percents.filter((_, i) => i !== action.payload);
          const newWidths = state.widths.filter((_, i) => i !== action.payload);
          return { ...state, percents: newPercents, widths: newWidths };
        }
      }
    },
    {
      rows: [],
      widths: [50, 100, 300, 100, 25, 25, 100],
      percents: [50],
      editRow: { id: null, field: null },
    }
  );

  React.useEffect(() => {
    window.api.send('toMain', { type: 'find' });
    window.api.receive('fromMain', ({ type, payload }: IPCMainMessage) => {
      switch (type) {
        case 'find': {
          dispatch({ type: 'set_rows', payload: payload as Row[] });
          break;
        }
        case 'insert': {
          dispatch({ type: 'add_row', payload: payload as Row });
          break;
        }
      }
    });
  }, []);

  function refreshAllRows() {
    console.log('Refreshing all');
  }

  function refreshRow(rowIndex: Row['_id']) {
    console.log(`Refreshing ${rowIndex}`);
  }

  function addRow() {
    const newRow = createData(null, null, null, null);
    window.api.send('toMain', { type: 'insert', payload: newRow });
  }

  function deleteRow(rowID: Row['_id']) {
    window.api.send('toMain', { type: 'remove', payload: { _id: rowID } });
    dispatch({ type: 'delete_row', payload: rowID });
  }

  function updateRow(rowID: Row['_id'], field: keyof Row, value: string) {
    value = value.trim();
    const updatedRow = state.rows.find(row => row._id === rowID);

    window.api.send('toMain', {
      type: 'update',
      payload: { _id: rowID, data: { ...updatedRow, [field]: value } },
    });

    dispatch({ type: 'update_row', payload: { ...updatedRow, [field]: value } });
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, rowID: Row['_id']) {
    const { name, value } = e.target;
    if (value) updateRow(rowID, name as keyof Row, value);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, rowID: Row['_id']) {
    const { value } = e.target;
    if (value) updateRow(rowID, 'gender', value);
  }

  function handleClick(e: React.MouseEvent, rowID: Row['_id'], field: string) {
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

    const options = genders.map(({ value, label }) => (
      <MenuItem key={value} value={value}>
        {label}
      </MenuItem>
    ));

    let content;
    if (state.editRow.id === row._id && state.editRow.field === 'gender') {
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

    if (state.editRow.id === row._id && state.editRow.field === field) {
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

  return (
    <>
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
        <colgroup>
          <col width='5%' />
          <col width='5%' />
          <col width='30%' />
          <col width='10%' />
          <col width='10%' />
          {state.percents.map((_, i) => (
            <col key={i} width='5%' />
          ))}
          <col width='11%' />
        </colgroup>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell align='center'></TableCell>
              <TableCell align='center'>№</TableCell>
              <TableCell align='left'>Фамилия, &nbsp;Имя, &nbsp;Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              {state.percents.map((percent, i) => {
                const showDelete = i !== 0;
                return (
                  <TableCell align='center' key={i} style={{ position: 'relative' }}>
                    {showDelete && (
                      <DeleteBtn
                        size='small'
                        iconStyle={{ width: 20 }}
                        style={{ position: 'absolute', right: -3, top: -5 }}
                        onClick={() => dispatch({ type: 'delete_percent', payload: i })}
                      />
                    )}
                    <Button>{percent}%</Button>
                  </TableCell>
                );
              })}
              <TableCell align='center'>
                <AddBtn
                  iconStyle={{ width: 29, height: 29 }}
                  onClick={() => dispatch({ type: 'add_percent' })}
                />
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
                {state.percents.map((percent, i) => (
                  <TableCell align='center' key={i}>
                    {row.hi ? (row.hi * percent) / 100 : '-'}
                  </TableCell>
                ))}
                <TableCell>
                  <RefreshBtn onClick={() => refreshRow(row._id)} />
                  <DeleteBtn onClick={() => deleteRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddBtn iconStyle={{ width: 40, height: 40 }} onClick={addRow} />
      </div>
    </>
  );
}

function createData(
  number: number | null,
  name: string | null,
  gender: string | null,
  hi: number | null
) {
  return { number, name, gender, hi };
}

ReactDOM.render(<App />, document.getElementById('root'));
