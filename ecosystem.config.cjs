module.exports = {
  apps: [{
    name: 'assurx-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart if server crashes
    restart_delay: 3000,
    // Max 15 restarts in 5 minutes window, then stop (prevents infinite crash loops)
    max_restarts: 15,
    min_uptime: '10s',
    // Kill timeout
    kill_timeout: 5000,
    // Log configuration
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // Expose GC for memory cleanup
    node_args: '--expose-gc'
  }]
};
