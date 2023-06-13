import { Apriori } from "../dist/apriori";

const apriori = new Apriori(0.1);
console.log(`Executing Apriori...`);
apriori.on('data', itemset => console.log(`Itemset { ${itemset.items.join(',')} } is frequent and have a support of ${itemset.support}`));
apriori.exec([
    [1, 2, 4, 5], [1, 3, 4], [2, 3, 5], [2, 3], [2, 4],
    [1, 3, 5], [1, 2, 3, 5], [2, 5], [1, 2, 3, 5]
]).then(result => console.log(`Finished executing Apriori. ${result.frequentItemsets.length} frequent itemsets were found in ${result.executionTime}ms.`));
