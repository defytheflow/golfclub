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

function App() {
  const [rows, setRows] = React.useState([
    createData('RU000873', 'Абахов Олег Евгеньевич ', 'Муж.', '15,2', '10'),
    createData('RU003775', 'Абрамов Кирилл Александрович ', 'Муж.', '25,3', '20'),
    createData('RU006019', 'Аброчнов Сергей Александрович ', 'Муж.', '38,9', '30'),
    createData('RU004852', 'Авдеева Наталия Витальевна ', 'Жен.', '21,1', '15'),
    createData('RU004215', 'Акаева Сайкал Эдильбековна ', 'Жен.', '28,5', '25'),
    createData('RU003776', 'Акимжанова Дана Талгатовна ', 'Жен.', '18,9', '100'),
    createData('RU006431', 'Акопян Ирина Рафаэловна ', 'Жен.', '38,4', '89'),
    createData('RU006713', 'Алексеев Николай Константинович ', 'Муж.', '53,5', '45'),
  ]);

  return (
    <div>
      <ButtonGroup color='primary' variant='outlined' style={{ cssFloat: 'right' }}>
        <Button startIcon={<AddIcon />}>Добавить</Button>
        <Button startIcon={<RefreshIcon />}>Обновить</Button>
      </ButtonGroup>
      <br />
      <br />
      <br />
      <TableContainer component={Paper}>
        <Table aria-label='simple table' size='small'>
          <TableHead>
            <TableRow>
              <TableCell align='center'>№</TableCell>
              <TableCell align='center'>Фамилия, Имя, Отчество</TableCell>
              <TableCell align='center'>Пол</TableCell>
              <TableCell align='center'>HI</TableCell>
              <TableCell align='center'>%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell component='th' scope='row'>
                  {row.number}
                </TableCell>
                <TableCell align='left'>{row.name}</TableCell>
                <TableCell align='right'>{row.gender}</TableCell>
                <TableCell align='right'>{row.hi}</TableCell>
                <TableCell align='right'>{row.percent}</TableCell>
                <TableCell>
                  <Refresh />
                  <Delete />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function Refresh() {
  return (
    <IconButton color='primary' aria-label='refresh' component='button'>
      <RefreshIcon />
    </IconButton>
  );
}

function Delete() {
  return (
    <IconButton color='secondary' aria-label='delete' component='button'>
      <DeleteIcon />
    </IconButton>
  );
}

function createData(number, name, gender, hi, percent) {
  return { number, name, gender, hi, percent };
}

ReactDOM.render(<App />, document.getElementById('root'));
