const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const winston = require('winston');

class SluntManager {
    constructor() {
        this.process = null;
        this.status = 'stopped';
        this.startTime = null;
        this.config = null;
        
        // Configure logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/slunt-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/slunt.log' })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'config', 'slunt-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            return this.config;
        } catch (error) {
            this.logger.error('Failed to load config:', error);
            // Create default config if none exists
            this.config = {
                botScript: 'contextual-slunt-bot.js',
                maxRuntime: 24 * 60 * 60 * 1000, // 24 hours
                autoRestart: true,
                logLevel: 'info'
            };
            await this.saveConfig();
            return this.config;
        }
    }

    async saveConfig() {
        try {
            const configDir = path.join(process.cwd(), 'config');
            await fs.mkdir(configDir, { recursive: true });
            const configPath = path.join(configDir, 'slunt-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            this.logger.error('Failed to save config:', error);
            throw error;
        }
    }

    async start() {
        if (this.process) {
            throw new Error('Slunt is already running');
        }

        await this.loadConfig();
        
        this.process = spawn('node', [this.config.botScript], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.status = 'running';
        this.startTime = new Date();

        // Log output
        this.process.stdout.on('data', (data) => {
            this.logger.info(data.toString());
        });

        this.process.stderr.on('data', (data) => {
            this.logger.error(data.toString());
        });

        // Handle process exit
        this.process.on('exit', (code) => {
            this.logger.info(`Slunt process exited with code ${code}`);
            this.process = null;
            this.status = 'stopped';
            
            // Auto-restart if enabled and not manually stopped
            if (this.config.autoRestart && this.status !== 'stopped') {
                this.logger.info('Auto-restarting Slunt...');
                this.start();
            }
        });

        return {
            status: this.status,
            startTime: this.startTime
        };
    }

    async stop() {
        if (!this.process) {
            throw new Error('Slunt is not running');
        }

        this.status = 'stopped'; // Set before killing to prevent auto-restart
        this.process.kill();
        this.process = null;
        this.startTime = null;

        return {
            status: this.status
        };
    }

    async restart() {
        await this.stop();
        return await this.start();
    }

    getStatus() {
        return {
            status: this.status,
            startTime: this.startTime,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            config: this.config
        };
    }

    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.saveConfig();
        return this.config;
    }
}

module.exports = SluntManager;