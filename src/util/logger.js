import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { tmpdir } from 'os';

const FORCE_CONSOLE_LOGS = process.env.FORCE_CONSOLE_LOGS === 'true' || false;
const SEPARATE_LOGS = process.env.SEPARATE_LOGS === 'true' || false;

const getLogsDir = () => {
    try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
        
        const possiblePaths = [
            path.join(process.cwd(), 'bismuth-logs'),
            path.join(homeDir, 'bismuth-logs'),
            //path.join(__dirname, 'bismuth-logs')
        ];
        
        for (const logPath of possiblePaths) {
            try {
                if (!fs.existsSync(logPath)) {
                    fs.mkdirSync(logPath, { recursive: true });
                }
                
                const testFile = path.join(logPath, 'test.txt');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                
                console.log(`Логи будут сохранены в: ${logPath}`);
                return logPath;
            } catch (err) {
                continue;
            }
        }
        
        const tempDir = path.join(tmpdir(), 'bismuth-logs');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        console.log(`Logs will be saved to temp dir: ${tempDir}`);
        return tempDir;
        
    } catch (error) {
        console.error('Error getting logs dir: ', error);
        return path.join(tmpdir(), 'bismuth-logs');
    }
};

const logs_dir = getLogsDir();
const base_log_file_name = path.join(logs_dir, 'bismuth');
const exception_log_file_name = SEPARATE_LOGS ? path.join(logs_dir, 'bismuth-exceptions') : base_log_file_name;
const rejection_log_file_name = SEPARATE_LOGS ? path.join(logs_dir, 'bismuth-rejections') : base_log_file_name;

let logger;

function errorWithContext(message, error, context = {}) {
    const errorDetails = error instanceof Error
        ? error.stack ?? `${error.name}: ${error.message}`
        : String(error);
    const contextDetails = JSON.stringify(context, null, 2);

    logger.error(`${message}\n${errorDetails}\nContext: ${contextDetails}`);
}

try {
    logger = winston.createLogger({
        level: "debug",

        format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf(({ timestamp, level, message }) => {
                return `[${timestamp}] ${`[${level.toUpperCase()}]:`.padEnd(8)} ${message}`;
            })
        ),

        transports: FORCE_CONSOLE_LOGS ? [new winston.transports.Console()] : [],

        exceptionHandlers: [
            new winston.transports.Console()
        ],
        rejectionHandlers: [
            new winston.transports.Console()
        ],
        exitOnError: false
    });
    
    // trying to add file transport
    try {
        const fileTransport = new winston.transports.File({ 
            filename: base_log_file_name + '.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        });
        
        logger.add(fileTransport);

        logger.exceptions.handle(fileTransport);
        logger.rejections.handle(fileTransport);
        
        // errors and rejections handlers
        // logger.exceptions.handle(
        //     SEPARATE_LOGS ? new winston.transports.File({ filename: exception_log_file_name + '.log' }) : fileTransport
        // );
        
        // logger.rejections.handle(
        //     SEPARATE_LOGS ? new winston.transports.File({ filename: rejection_log_file_name + '.log' }) : fileTransport
        // );
        
    } catch (fileError) {
        logger.warn(`Error adding file transport: ${fileError.message}`);
    }
    
    logger.info('-------------------------------------\n');
    logger.info('Logger initialized');
    
} catch (error) {
    // Fallback: simple console logger
    console.error('Error initializing logger: ', error);

    logger = {
        info: (msg) => console.log(`[INFO]: ${msg}`),
        error: (msg) => console.error(`[ERROR]: ${msg}`),
        warn: (msg) => console.warn(`[WARN]: ${msg}`),
        debug: (msg) => console.debug(`[DEBUG]: ${msg}`)
    };

    logger.info('Using fallback logger (console)');
}

if (typeof logger.errorWithContext !== 'function') {
    logger.errorWithContext = errorWithContext;
}

export default logger;