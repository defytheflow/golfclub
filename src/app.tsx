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

type EditedRow = {
  id: number | null;
  field: string | null;
};

// TODO: change widths. makew widths static. add gorizontal scrollbar.
// TODO: Ctrl + z for rows deletions.
function App() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [percents, setPercents] = React.useState([10, 20]);
  const [editedRow, setEditedRow] = React.useState<EditedRow>({ id: null, field: null });

  React.useEffect(() => {
    window.api.send('toMain', { type: 'find' });
    window.api.receive('fromMain', ({ type, payload }: IPCMainMessage) => {
      switch (type) {
        case 'find': {
          setRows(payload as Row[]);
          break;
        }
        case 'insert': {
          setRows(prevRows => [...prevRows, payload as Row]);
          break;
        }
      }
    });
  }, []);

  function refreshAllRows() {
    console.log('Refreshing all');
  }

  function refreshRow(rowIndex: number) {
    console.log(`Refreshing ${rowIndex}`);
  }

  function addRow() {
    const newRow = createData(null, null, null, null);
    window.api.send('toMain', { type: 'insert', payload: newRow });
  }

  function deleteRow(rowID: number) {
    window.api.send('toMain', { type: 'remove', payload: { _id: rowID } });
    setRows(prevRows => prevRows.filter(row => row._id !== rowID));
  }

  function updateRow(rowID: number, field: keyof Row, value: string) {
    value = value.trim();
    const updatedRow = rows.find(row => row._id === rowID);

    window.api.send('toMain', {
      type: 'update',
      payload: { _id: rowID, data: { ...updatedRow, [field]: value } },
    });

    setRows(prevRows => {
      const newRows = prevRows.slice();
      const rowIndex = newRows.findIndex(row => row._id === rowID);
      newRows[rowIndex] = { ...updatedRow, [field]: value };
      return newRows;
    });

    setEditedRow({ id: null, field: null });
  }

  function addPercent() {
    setPercents(prevPercents => [...prevPercents, 5]);
  }

  function deletePercent(percentI: number) {
    setPercents(prevPercents => prevPercents.filter((_, i) => i !== percentI));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, rowID: number) {
    const { name, value } = e.target;
    if (value) updateRow(rowID, name as keyof Row, value);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, rowID: number) {
    const { value } = e.target;
    if (value) updateRow(rowID, 'gender', value);
  }

  function handleClick(e: React.MouseEvent, rowID: number, field: string) {
    setEditedRow({ id: rowID, field });
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
    if (editedRow.id === row._id && editedRow.field === 'gender') {
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

    if (editedRow.id === row._id && editedRow.field === field) {
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
        <Table size='small'>
          <colgroup>
            <col width='5%' />
            <col width='5%' />
            <col width='30%' />
            <col width='10%' />
            <col width='10%' />
            {percents.map((_, i) => (
              <col key={i} width='5%' />
            ))}
            <col width='11%' />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align='center'></TableCell>
              <TableCell align='center'>№</TableCell>
              <TableCell align='left'>Фамилия, &nbsp;Имя, &nbsp;Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              {percents.map((percent, i) => {
                const showDelete = i !== 0;
                return (
                  <TableCell align='center' key={i} style={{ position: 'relative' }}>
                    {showDelete && (
                      <DeleteBtn
                        size='small'
                        iconStyle={{ width: 20 }}
                        style={{ position: 'absolute', right: -3, top: -5 }}
                        onClick={() => deletePercent(i)}
                      />
                    )}
                    <Button>{percent}%</Button>
                  </TableCell>
                );
              })}
              <TableCell align='center'>
                <AddBtn iconStyle={{ width: 29, height: 29 }} onClick={addPercent} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell align='center'>{i + 1}</TableCell>
                {renderCell(row, 'number', null)}
                {renderCell(row, 'name', { align: 'left' })}
                {renderGenderCell(row)}
                {renderCell(row, 'hi', null)}
                {percents.map((percent, i) => (
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
