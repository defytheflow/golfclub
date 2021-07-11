import React from 'react';

import Button, { ButtonProps } from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton, { IconButtonProps } from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import { makeStyles } from '@material-ui/core/styles';

interface MyIconButtonProps extends IconButtonProps {
  title?: string;
  iconStyle?: React.CSSProperties;
}

export function MyButton({ children, ...rest }: ButtonProps) {
  const classes = makeStyles({
    label: {
      fontWeight: 'normal',
      textTransform: 'none',
    },
  })();
  return (
    <Button classes={{ ...rest.classes, ...classes }} {...rest}>
      {children}
    </Button>
  );
}

export function AddBtn({ title = 'Добавить', iconStyle, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton
        style={{ color: '#4caf50' }}
        color='primary'
        component='button'
        {...rest}>
        <AddIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function DeleteBtn({ title = 'Удалить', iconStyle, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton color='secondary' component='button' {...rest}>
        <ClearIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function RefreshBtn({
  title = 'Обновить',
  iconStyle,
  ...rest
}: MyIconButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton color='primary' component='button' {...rest}>
        <RefreshIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function RestoreBtn({
  title = 'Восстановить вид',
  iconStyle = { width: 35, height: 35 },
  ...rest
}: MyIconButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton color='primary' component='button' {...rest}>
        <ViewModuleIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}
