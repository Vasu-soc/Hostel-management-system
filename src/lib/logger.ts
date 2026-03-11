
export type LogEvent = {
  eventType: 'INFO' | 'ERROR' | 'WARN';
  action: string;
  username?: string;
  status: 'success' | 'failure' | 'pending';
  ip?: string;
};

/**
 * Centralized logger for HosteliHub.
 * Sends logs to the local Vite middleware which writes to logs/app.log
 */
export const logger = {
  async log(event: LogEvent) {
    try {
      // Get IP if possible, though server will also detect it
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        console.error('Failed to send log to server:', await response.text());
      }
    } catch (error) {
      console.error('Logger error:', error);
    }
  },

  info(action: string, username?: string, status: 'success' | 'failure' | 'pending' = 'success') {
    return this.log({ eventType: 'INFO', action, username, status });
  },

  error(action: string, username?: string, status: 'success' | 'failure' | 'pending' = 'failure') {
    return this.log({ eventType: 'ERROR', action, username, status });
  },

  warn(action: string, username?: string, status: 'success' | 'failure' | 'pending' = 'success') {
    return this.log({ eventType: 'WARN', action, username, status });
  }
};
