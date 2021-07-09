import React from 'react';
import ReactDOM from 'react-dom';
import { css } from '@emotion/react';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddIcon from '@material-ui/icons/Add';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import ClearIcon from '@material-ui/icons/Clear';
import ViewModuleIcon from '@material-ui/icons/ViewModule';

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

// TODO: change widths. makew widths static. add gorizontal scrollbar.
// TODO: Ctrl + z for rows deletions.
// TODO: green color for plus icons.
function App() {
  const [rows, setRows] = React.useState([]);
  const [percents, setPercents] = React.useState([10, 20]);
  const [editedRow, setEditedRow] = React.useState({ id: null, field: null });

  React.useEffect(() => {
    window.api.send('toMain', { type: 'find' });
    window.api.receive('fromMain', ({ type, payload }) => {
      if (type === 'insert') {
        setRows(prevRows => [...prevRows, payload]);
      } else {
        setRows(payload);
      }
    });
  }, []);

  function refreshAllRows() {
    console.log('Refreshing all');
  }

  function refreshRow(rowIndex) {
    console.log(`Refreshing ${rowIndex}`);
  }

  function addRow() {
    const newRow = createData(null, null, null, null, null);
    window.api.send('toMain', { type: 'insert', payload: newRow });
  }

  function deleteRow(rowID) {
    window.api.send('toMain', { type: 'remove', payload: { _id: rowID } });
    setRows(prevRows => prevRows.filter(row => row._id !== rowID));
  }

  function updateRow(rowID, field, value) {
    value = value.trim();
    const updatedRow = rows.find(row => row._id === rowID);

    window.api.send('toMain', {
      type: 'update',
      payload: { _id: rowID, data: { ...updatedRow, [field]: value } },
    });

    setRows(prevRows => {
      const newRows = prevRows.slice();
      const updatedRow = newRows.find(row => row._id === rowID);
      updatedRow[field] = value;
      return newRows;
    });

    setEditedRow({ rowID: null, field: null });
  }

  function addPercent() {
    setPercents(prevPercents => [...prevPercents, 5]);
  }

  function deletePercent(percentI) {
    setPercents(prevPercents => prevPercents.filter((_, i) => i !== percentI));
  }

  function handleBlur(e, rowID) {
    const { name, value } = e.target;
    if (value) updateRow(rowID, name, value);
  }

  function handleChange(e, rowID) {
    const { value } = e.target;
    if (value) updateRow(rowID, 'gender', value);
  }

  function handleClick(e, rowID, field) {
    setEditedRow({ id: rowID, field });
  }

  function renderGenderCell(row) {
    const inputProps = {
      autoFocus: true,
      select: true,
      style: {
        minWidth: '100%',
      },
      value: row.gender ?? '',
      onChange: e => handleChange(e, row._id),
      onBlur: e => handleBlur(e, row._id),
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

  function renderCell(row, field, cellProps = {}, inputProps = {}) {
    let content;
    let baseInputProps = {
      autoFocus: true,
      name: field,
      onBlur: e => handleBlur(e, row._id),
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
        <Tooltip title='Восстановить вид' placement='bottom'>
          <IconButton
            color='primary'
            component='button'
            variant='outlined'
            >
            <ViewModuleIcon css={{ width: 35, height: 35 }}/>
          </IconButton>
        </Tooltip>
        <Tooltip title='Обновить всe' placement='bottom'>
          <IconButton
            color='primary'
            component='button'
            variant='outlined'
            onClick={refreshAllRows}>
            <RefreshIcon css={{ width: 35, height: 35 }} />
          </IconButton>
        </Tooltip>
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
                      <Delete
                        size='small'
                        css={{ position: 'absolute', right: -3, top: -5 }}
                        iconCss={{ width: 20 }}
                        onClick={() => deletePercent(i)}
                      />
                    )}
                    <Button>{percent}%</Button>
                  </TableCell>
                );
              })}
              <TableCell align='center'>
                <Add iconCss={{ width: 29, height: 29 }} onClick={addPercent} />
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
                  <Refresh onClick={() => refreshRow(row._id)} />
                  <Delete onClick={() => deleteRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Add iconCss={{ width: 40, height: 40 }} onClick={addRow} />
      </div>
    </>
  );
}

function Add({ iconCss, title = 'Добавить', ...rest }) {
  return (
    <Tooltip title={title} placement='bottom'>
      <IconButton color='primary' component='button' variant='outlined' {...rest}>
        <AddIcon  css={iconCss} />
      </IconButton>
    </Tooltip>
  );
}

function Refresh({ onClick }) {
  return (
    <Tooltip title='Обновить'>
      <IconButton color='primary' component='button' onClick={onClick}>
        <RefreshIcon />
      </IconButton>
    </Tooltip>
  );
}

function Delete({ iconCss, placement = 'bottom', ...rest }) {
  return (
    <Tooltip title='Удалить' placement={placement}>
      <IconButton color='secondary' component='button' {...rest}>
        <ClearIcon css={iconCss} />
      </IconButton>
    </Tooltip>
  );
}

function createData(number, name, gender, hi, percent) {
  return { number, name, gender, hi, percent };
}

ReactDOM.render(<App />, document.getElementById('root'));
