import { isElectron, getElectronAPI, dbQuery, dbExecute } from '@/utils/electron';

describe('Electron Utilities', () => {
  const mockElectronAPI = {
    db: {
      query: jest.fn(),
      execute: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    window.electronAPI = undefined;
  });

  describe('isElectron', () => {
    it('returns false when window.electronAPI is not defined', () => {
      expect(isElectron()).toBe(false);
    });

    it('returns true when window.electronAPI is defined', () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      expect(isElectron()).toBe(true);
    });
  });

  describe('getElectronAPI', () => {
    it('throws error when not in Electron', () => {
      expect(() => getElectronAPI()).toThrow('Not running in Electron environment');
    });

    it('returns API object when in Electron', () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      expect(getElectronAPI()).toBe(mockElectronAPI);
    });
  });

  describe('dbQuery', () => {
    it('executes query successfully', async () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      mockElectronAPI.db.query.mockResolvedValue({ success: true, data: ['row1', 'row2'] });

      const result = await dbQuery('SELECT * FROM table');
      expect(result).toEqual(['row1', 'row2']);
      expect(mockElectronAPI.db.query).toHaveBeenCalledWith('SELECT * FROM table', undefined);
    });

    it('throws error on failure', async () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      mockElectronAPI.db.query.mockResolvedValue({ success: false, error: 'Query failed' });

      await expect(dbQuery('SELECT * FROM table')).rejects.toThrow('Query failed');
    });
  });

  describe('dbExecute', () => {
    it('executes command successfully', async () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      mockElectronAPI.db.execute.mockResolvedValue({ success: true, data: { changes: 1, lastInsertRowid: 1 } });

      const result = await dbExecute('INSERT INTO table VALUES (?)', ['val']);
      expect(result).toEqual({ changes: 1, lastInsertRowid: 1 });
      expect(mockElectronAPI.db.execute).toHaveBeenCalledWith('INSERT INTO table VALUES (?)', ['val']);
    });

    it('throws error on failure', async () => {
      // @ts-ignore
      window.electronAPI = mockElectronAPI;
      mockElectronAPI.db.execute.mockResolvedValue({ success: false, error: 'Exec failed' });

      await expect(dbExecute('INSERT INTO table VALUES (?)', ['val'])).rejects.toThrow('Exec failed');
    });
  });
});
