export class MoneyFormatter {
    static formatCents(cents) {
        return `€${(cents / 100).toFixed(2)}`;
    }
}
