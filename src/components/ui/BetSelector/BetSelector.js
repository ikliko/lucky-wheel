
export class BetSelector {
    #enabled = true;

    constructor(
        allowedBetsCents,
        onSelect,
        defaultBetCents = allowedBetsCents[0]
    ) {
        this.allowedBetsCents = [...allowedBetsCents];
        this.onSelect = onSelect;
        this.selectedBetCents = this.allowedBetsCents.includes(defaultBetCents)
            ? defaultBetCents
            : this.allowedBetsCents[0];
    }

    selectBet(cents) {
        if (!this.#enabled) {
            return;
        }

        if (!this.allowedBetsCents.includes(cents)) {
            return;
        }

        this.selectedBetCents = cents;
        this.onSelect?.(cents);
    }

    setSelected(cents) {
        if (!this.allowedBetsCents.includes(cents)) {
            return;
        }

        this.selectedBetCents = cents;
    }

    setEnabled(enabled) {
        this.#enabled = Boolean(enabled);
    }

    get enabled() {
        return this.#enabled;
    }
}
