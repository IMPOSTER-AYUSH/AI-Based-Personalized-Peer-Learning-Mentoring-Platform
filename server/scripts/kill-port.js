/**
 * Kill any process using the configured PORT before starting the server.
 * Works on Windows (netstat + taskkill) and Unix (lsof + kill).
 */
const { execSync } = require('child_process');
const PORT = process.env.PORT || 5000;

try {
  if (process.platform === 'win32') {
    // Find PID listening on the port
    const output = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const pids = new Set();
    output.split('\n').forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !isNaN(pid)) pids.add(pid);
    });
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`🧹 Killed stale process on port ${PORT} (PID ${pid})`);
      } catch (_) {}
    });
  } else {
    // macOS / Linux
    try {
      const output = execSync(`lsof -ti :${PORT}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const pids = output.trim().split('\n').filter(Boolean);
      pids.forEach((pid) => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`🧹 Killed stale process on port ${PORT} (PID ${pid})`);
        } catch (_) {}
      });
    } catch (_) {}
  }
} catch (_) {
  // No process on port — all good
}
