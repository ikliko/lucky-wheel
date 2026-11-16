import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

export class BalanceDisplay {
    constructor() {
        this.text = MoneyFormatter.formatCents(0);
    }

    setCents(cents) {
        this.text = MoneyFormatter.formatCents(cents);
    }
}
