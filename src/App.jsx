import React from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
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

function App() {
  const [rows, setRows] = React.useState([]);

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

  function handleBlur(e, rowID) {
    const { name, value } = e.target;
    const updatedRow = rows.find(row => row._id === rowID);
    if (value) {
      window.api.send('toMain', {
        type: 'update',
        payload: { _id: rowID, data: { ...updatedRow, [name]: value } },
      });
      updateRow(rowID, name, value);
    }
  }

  function handleChange(e, rowID) {
    const { value } = e.target;
    const updatedRow = rows.find(row => row._id === rowID);
    if (value) {
      window.api.send('toMain', {
        type: 'update',
        payload: { _id: rowID, data: { ...updatedRow, gender: value } },
      });
      updateRow(rowID, 'gender', value);
    }
  }

  function updateRow(rowID, field, value) {
    setRows(prevRows => {
      const newRows = prevRows.slice();
      const updatedRow = newRows.find(row => row._id === rowID);
      updatedRow[field] = value;
      return newRows;
    });
  }

  return (
    <div>
      <ButtonGroup color='primary' variant='outlined' style={{ cssFloat: 'right' }}>
        <Button startIcon={<AddIcon />} onClick={addRow}>
          Добавить
        </Button>
        <Button startIcon={<RefreshIcon />} onClick={refreshAllRows}>
          Обновить
        </Button>
      </ButtonGroup>
      <br />
      <br />
      <br />
      <TableContainer component={Paper}>
        <Table aria-label='simple table' size='small'>
          <TableHead>
            <TableRow>
              <TableCell align='center'>№</TableCell>
              <TableCell align='left'>Фамилия, Имя, Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              <TableCell align='center'>%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell component='th' scope='row'>
                  {row.number ?? (
                    <TextField
                      name='number'
                      style={{ width: 50 }}
                      onBlur={e => handleBlur(e, row._id)}
                    />
                  )}
                </TableCell>
                <TableCell align='left' onClick={() => console.log('click')}>
                  {row.name ?? (
                    <TextField
                      name='name'
                      autoFocus
                      onBlur={e => handleBlur(e, row._id)}
                    />
                  )}
                </TableCell>
                <TableCell align='right'>
                  {row.gender ?? (
                    <TextField
                      id='standard-select-currency'
                      select
                      style={{ width: 50 }}
                      onChange={e => handleChange(e, row._id)}>
                      {genders.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </TableCell>
                <TableCell align='right'>
                  {row.hi ?? (
                    <TextField
                      name='hi'
                      type='number'
                      style={{ width: 50 }}
                      onBlur={e => handleBlur(e, row._id)}
                    />
                  )}
                </TableCell>
                <TableCell align='right'>
                  {row.percent ?? (
                    <TextField
                      name='percent'
                      type='number'
                      style={{ width: 50 }}
                      onBlur={e => handleBlur(e, row._id)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Refresh onClick={() => refreshRow(i)} />
                  <Delete onClick={() => deleteRow(row._id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function Refresh({ onClick }) {
  return (
    <Tooltip title='Обновить'>
      <IconButton
        color='primary'
        aria-label='refresh'
        component='button'
        onClick={onClick}>
        <RefreshIcon />
      </IconButton>
    </Tooltip>
  );
}

function Delete({ onClick }) {
  return (
    <Tooltip title='Удалить'>
      <IconButton
        color='secondary'
        aria-label='delete'
        component='button'
        onClick={onClick}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );
}

function createData(number, name, gender, hi, percent) {
  return { number, name, gender, hi, percent };
}

ReactDOM.render(<App />, document.getElementById('root'));
