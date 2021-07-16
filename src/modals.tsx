import React from 'react';

import Modal, { ModalProps } from '@material-ui/core/Modal';
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

interface HelpModalProps extends Omit<ModalProps, 'children'> {
  defaultChecked: boolean;
  onCheck: (value: boolean) => unknown;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 5,
    outline: 0,
    width: '50%',
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
  },
  indicator: {
    display: 'flex',
    gap: 7,
  },
});

export function HelpModal({ defaultChecked, onCheck, onClose, ...rest }: HelpModalProps) {
  const [isChecked, setChecked] = React.useState(defaultChecked);
  const classes = useStyles();

  // eslint-disable-next-line
  function handleClose(event: {}, reason: 'backdropClick' | 'escapeKeyDown') {
    if (isChecked !== defaultChecked) {
      onCheck(isChecked);
    }
    onClose?.(event, reason);
  }

  return (
    <Modal className={classes.root} onClose={handleClose} {...rest}>
      <div className={classes.content}>
        <h1 style={{ marginTop: '-0.5rem' }}>Инструкция</h1>

        <section>
          <h3>Кнопки</h3>
          <table>
            <tbody>
              <tr>
                <td className={classes.button}>
                  <AddButton />
                </td>
                <td>добавляет строку или столбец</td>
              </tr>
              <tr>
                <td className={classes.button}>
                  <RefreshButton iconStyle={{ width: 20, height: 20 }} />{' '}
                </td>
                <td>
                  обновляет все HI{' '}
                  <small>(частые нажатия могут привести к блокировке на сайте)</small>
                </td>
              </tr>
              <tr>
                <td className={classes.button}>
                  <DeleteButton />
                </td>
                <td>удаляет строку или столбец</td>
              </tr>
              <tr>
                <td className={classes.button}>
                  <CancelButton iconStyle={{ width: 20, height: 20 }} />
                </td>
                <td>отменяет загрузку обновления</td>
              </tr>
              <tr>
                <td className={classes.button}>
                  <ClearButton />
                </td>
                <td>
                  удаляет все
                  <WarningIcon
                    style={{
                      height: 20,
                      width: 20,
                      color: 'orange',
                      position: 'relative',
                      top: '0.2rem',
                      left: 5,
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3>Сочетания Клавиш</h3>
          <div>
            <strong>{window.platform === 'darwin' ? 'Cmd+Z' : 'Ctrl+Z'}</strong> -
            возвращает последний удаленный столбец или строку
          </div>
        </section>

        <section>
          <h3>Индикаторы</h3>
          <div className={classes.indicator} style={{ marginBottom: '0.75rem' }}>
            <CircularProgress style={{ height: 20, width: 20 }} />- строка обновляется
          </div>
          <div className={classes.indicator}>
            <WarningIcon style={{ height: 20, width: 20, color: 'orange' }} />- данные
            отсутствуют на сервере
          </div>
        </section>

        <hr />
        <div className={classes.control}>
          <input
            id='show-help'
            type='checkbox'
            checked={isChecked}
            onChange={e => setChecked(e.target.checked)}
          />
          <label htmlFor='show-help'>Больше не показывать</label>
        </div>
      </div>
    </Modal>
  );
}

interface ErrorModalProps extends Omit<ModalProps, 'children'> {
  message: string;
}

export function ErrorModal({ message, ...rest }: ErrorModalProps) {
  const classes = useStyles();
  return (
    <Modal className={classes.root} {...rest}>
      <div className={classes.content}>
        <h1 style={{ color: 'red' }}>Ошибка</h1>
        <p>{message}</p>
      </div>
    </Modal>
  );
}
