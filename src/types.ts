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
      payload: { _id: number };
    }
  | {
      type: 'update';
      payload: { _id: number; data: Row };
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
  _id: number;
  number: number;
  name: string;
  gender: string;
  hi: number;
};
