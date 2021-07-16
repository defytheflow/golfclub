import React from 'react';

import Tooltip from '@material-ui/core/Tooltip';
import IconButton, { IconButtonProps } from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import { makeStyles } from '@material-ui/core/styles';
import BlockIcon from '@material-ui/icons/Block';
import BeenhereIcon from '@material-ui/icons/Beenhere';

interface MyIconButtonProps extends IconButtonProps {
  iconStyle?: React.CSSProperties;
}

export function CellButton({ align, children, ...rest }: any) {
  return (
    <button
      {...rest}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        width: '100%',
        minHeight: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align == 'left' ? 'left' : 'center',
        // cursor: 'pointer',
        // backgroundColor: 'yellow',
      }}>
      {children}
    </button>
  );
}

const useAddButtonStyles = makeStyles({
  root: {
    color: '#4caf50',
  },
});

export function AddButton({ iconStyle, ...rest }: MyIconButtonProps) {
  const classes = useAddButtonStyles();
  return (
    <Tooltip title='Добавить'>
      <IconButton
        classes={{ ...rest.classes, ...classes }}
        color='primary'
        component='button'
        {...rest}>
        <AddIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function DeleteButton({ iconStyle, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title='Удалить'>
      <IconButton color='secondary' component='button' {...rest}>
        <ClearIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function RefreshButton({ iconStyle, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title='Обновить'>
      <IconButton color='primary' component='button' {...rest}>
        <RefreshIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function CancelButton({ iconStyle, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title='Отменить'>
      <IconButton color='secondary' component='button' {...rest}>
        <BlockIcon style={iconStyle} />
      </IconButton>
    </Tooltip>
  );
}

export function ClearButton({ style, ...rest }: MyIconButtonProps) {
  return (
    <Tooltip title='Очистить'>
      <IconButton style={{ ...style, color: 'green' }} {...rest}>
        <BeenhereIcon />
      </IconButton>
    </Tooltip>
  );
}
