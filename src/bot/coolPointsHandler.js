// CoolPointsHandler: Handles CoolPoints balance, transactions, debt, and mood impact
// Modularized for performance and maintainability

const fs = require('fs').promises;
const fsSync = require('fs'); // Keep sync for initial load only
const path = require('path');
const coolPointsPath = path.join(__dirname, '../../data/coolpoints.json');

class CoolPointsHandler {
    constructor() {
        this.coolPoints = {};
        this.debtLevels = {};
        this.loadCoolPoints();
    }

    loadCoolPoints() {
        try {
            // Initial load can be sync since it's during startup
            const data = fsSync.readFileSync(coolPointsPath, 'utf8');
            this.coolPoints = JSON.parse(data);
        } catch (err) {
            this.coolPoints = {};
        }
    }

    async saveCoolPoints() {
        await fs.writeFile(coolPointsPath, JSON.stringify(this.coolPoints, null, 2));
    }

    getBalance(user) {
        return this.coolPoints[user] ? this.coolPoints[user].balance : 0;
    }

    async setBalance(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance = amount;
        await this.saveCoolPoints();
    }

    async addPoints(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance += amount;
        await this.saveCoolPoints();
    }

    async deductPoints(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance -= amount;
        await this.saveCoolPoints();
    }

    getDebtLevel(user) {
        return this.coolPoints[user] ? this.coolPoints[user].debt : 0;
    }

    async setDebtLevel(user, level) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].debt = level;
        await this.saveCoolPoints();
    }

    async transferPoints(from, to, amount) {
        if (this.getBalance(from) >= amount) {
            await this.deductPoints(from, amount);
            await this.addPoints(to, amount);
            return true;
        }
        return false;
    }

    // Mood impact based on CoolPoints balance
    getMoodImpact(user) {
        const balance = this.getBalance(user);
        if (balance > 10000) return 'ecstatic';
        if (balance > 1000) return 'happy';
        if (balance > 100) return 'neutral';
        if (balance > 0) return 'anxious';
        return 'despair';
    }
}

module.exports = CoolPointsHandler;
