declare global {
  interface Window {
    api: {
      send: (channel: 'toMain', message: IPCRendererMessage) => void;
      receive: (channel: 'fromMain', func: (message: IPCMainMessage) => void) => void;
    };
  }
}

export type IPCRendererMessage =
  | {
      type: 'find';
      payload?: null;
    }
  | {
      type: 'insert';
      payload: Omit<Row, '_id'>;
    }
  | {
      type: 'remove';
      payload: Pick<Row, '_id'>;
    }
  | {
      type: 'update';
      payload: { _id: Row['_id']; data: Row };
    };

export type IPCMainMessage =
  | {
      type: 'find';
      payload: Row[];
    }
  | {
      type: 'insert';
      payload: Row;
    };

export type Row = {
  _id: string;
  number: number;
  name: string;
  gender: string;
  hi: number;
};
