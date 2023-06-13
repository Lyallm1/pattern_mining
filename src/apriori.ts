import { EventEmitter } from 'events';

export interface IAprioriEvents<T> {
    on(event: 'data', listener: (itemset: Itemset<T>) => void): this;
    on(event: string, listener: Function): this;
}
export interface IAprioriResults<T> {
    itemsets: Itemset<T>[];
    executionTime: number;
}
export interface Itemset<T> {
    items: T[];
    support: number;
}

export class Apriori<T> extends EventEmitter implements IAprioriEvents<T> {
    private _transactions: T[][];

    constructor(private _support: number) {
        super();
    }

    exec(transactions: T[][], cb?: (result: IAprioriResults<T>) => any): Promise<IAprioriResults<T>> {
        this._transactions = transactions;
        this._support = Math.ceil(this._support * transactions.length);
        return new Promise(resolve => {
            const count = transactions.reduce((count, arr) => arr.reduce((count, item) => {
                count[JSON.stringify(item)] = (count[JSON.stringify(item)] || 0) + 1;
                return count;
            }, count), {} as {[stringifiedItem: string]: number}), time = process.hrtime(), frequentItemsets = [Object.keys(count).reduce((ret, stringifiedItem) => {
                if (count[stringifiedItem] >= this._support) {
                    const frequentItemset: Itemset<T> = { support: count[stringifiedItem], items: [JSON.parse(stringifiedItem)] };
                    ret.push(frequentItemset);
                    this.emit('data', frequentItemset)
                }
                return ret;
            }, [] as Itemset<T>[])];
            let i = 0;
            while (frequentItemsets[i].length > 0) {
                frequentItemsets.push(!frequentItemsets[i].length ? [] : this._getCandidatesCount(
                    this._generateKCandidates(frequentItemsets[i].reduce((items, itemset) => items.concat(itemset.items), [] as T[]).filter(
                        (item, index, that) => that.indexOf(item) === index
                    ), frequentItemsets[i][0].items.length + 1)
                ).filter(itemset => {
                    const isFrequent = itemset.support >= this._support;
                    if (isFrequent) this.emit('data', itemset);
                    return isFrequent;
                }));
                i++;
            }
            const elapsedTime = process.hrtime(time), result: IAprioriResults<T> = {
                itemsets: [].concat.apply([], frequentItemsets), executionTime: Math.round(elapsedTime[0] * 1000 + elapsedTime[1] / 1000000)
            };
            if (cb) cb(result);
            resolve(result);
        });
    }

    private _generateKCandidates(items: T[], k: number): Itemset<T>[] {
        if (k > items.length || k <= 0) return [];
        if (k == items.length) return [{ items, support: 0 }];
        if (k == 1) return items.map(item => ({ items: [item], support: 0 }));
        const ret = [];
        for (let i = 0; i < items.length - k + 1; i++) this._generateKCandidates(items.slice(i + 1), k - 1).forEach(tailcomb => ret.push({
            items: items.slice(i, i + 1).concat(tailcomb.items), support: 0
        }));
        return ret;
    }

    private _getCandidatesCount(candidates: Itemset<T>[]): Itemset<T>[] {
        this._transactions.forEach(transaction => candidates.forEach(candidate => {
            if (candidate.items.every(item => transaction.indexOf(item) !== -1)) candidate.support++;
        }));
        return candidates;
    }
}
