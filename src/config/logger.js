const winston = require('winston');

// Define the log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Write logs to console.
    // Cloud Run/Render 같은 컨테이너 환경은 stdout/stderr을 자동으로 수집하므로
    // 콘솔 로깅만으로 충분하다. (예전엔 production에서 logs/ 파일에도 썼는데,
    // Cloud Run은 비-root·읽기전용 파일시스템이라 mkdir이 EACCES로 죽었다.
    // 파일 로깅이 꼭 필요하면 LOG_TO_FILE=true + 쓰기 가능한 경로에서만 켠다.)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    // 선택: 명시적으로 켠 경우에만 파일 로깅 (쓰기 가능한 환경 전제)
    ...(process.env.LOG_TO_FILE === 'true'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

module.exports = logger;