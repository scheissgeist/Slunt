// CoolPointsHandler: Handles CoolPoints balance, transactions, debt, and mood impact
// Modularized for performance and maintainability

const fs = require('fs');
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
            const data = fs.readFileSync(coolPointsPath, 'utf8');
            this.coolPoints = JSON.parse(data);
        } catch (err) {
            this.coolPoints = {};
        }
    }

    saveCoolPoints() {
        fs.writeFileSync(coolPointsPath, JSON.stringify(this.coolPoints, null, 2));
    }

    getBalance(user) {
        return this.coolPoints[user] ? this.coolPoints[user].balance : 0;
    }

    setBalance(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance = amount;
        this.saveCoolPoints();
    }

    addPoints(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance += amount;
        this.saveCoolPoints();
    }

    deductPoints(user, amount) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].balance -= amount;
        this.saveCoolPoints();
    }

    getDebtLevel(user) {
        return this.coolPoints[user] ? this.coolPoints[user].debt : 0;
    }

    setDebtLevel(user, level) {
        if (!this.coolPoints[user]) this.coolPoints[user] = { balance: 0, debt: 0 };
        this.coolPoints[user].debt = level;
        this.saveCoolPoints();
    }

    transferPoints(from, to, amount) {
        if (this.getBalance(from) >= amount) {
            this.deductPoints(from, amount);
            this.addPoints(to, amount);
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
