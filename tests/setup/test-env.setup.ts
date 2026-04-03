Object.assign(process.env, {
  NODE_ENV: 'test',
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'test',
  DATABASE_URL:
    process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/rbdt-online-tests',
  JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-123',
  VIDEO_SECRET_TOKEN: process.env.VIDEO_SECRET_TOKEN || 'test-video-secret-123',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.test.local',
  EMAIL_PORT: process.env.EMAIL_PORT || '587',
  EMAIL_USER: process.env.EMAIL_USER || 'test@rotembaruch.dance',
  EMAIL_PASS: process.env.EMAIL_PASS || 'test-password',
  EMAIL_ACCESS_BACKUP_RECIPIENT:
    process.env.EMAIL_ACCESS_BACKUP_RECIPIENT || 'royinagar1@gmail.com',
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
  GREENINVOICE_API_URL:
    process.env.GREENINVOICE_API_URL || 'https://api.greeninvoice.co.il/api/v1',
  GREENINVOICE_API_KEY:
    process.env.GREENINVOICE_API_KEY || 'test-greeninvoice-key',
  GREENINVOICE_API_SECRET:
    process.env.GREENINVOICE_API_SECRET || 'test-greeninvoice-secret',
});
