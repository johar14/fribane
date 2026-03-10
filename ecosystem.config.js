module.exports = {
  apps: [
    {
      name: 'fribane',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/fribane',
      max_restarts: 10,
      min_uptime: 6000,       // App skal køre 6s for at tælle som stabil
      restart_delay: 1000,    // 1s pause mellem hvert genforsøg
      exp_backoff_restart_delay: 100,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
