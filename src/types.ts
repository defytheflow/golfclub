declare global {
  interface Window {
    platform: NodeJS.Platform;
    api: {
      send: (channel: 'toMain', message: DBAction) => void;
      receive: (channel: 'fromMain', func: (action: DBAction) => void) => void;
    };
  }
}

export type DBAction =
  | {
      type: 'load';
      payload?: { rows: Row[]; columns: Column[] };
    }
  | {
      type: 'insert_row';
      payload: Row;
    }
  | {
      type: 'update_row';
      payload: Partial<Row>;
    }
  | {
      type: 'remove_row';
      payload: Row['_id'];
    }
  | {
      type: 'insert_column';
      payload: Column;
    }
  | {
      type: 'update_column';
      payload: Partial<Column>;
    }
  | {
      type: 'remove_column';
      payload: Column['_id'];
    };

export type Row = {
  _id?: string;
  number: number;
  name: string;
  gender: string;
  hi: number;
};

export type Column = {
  _id?: string;
  width: number;
  percent?: number;
};
