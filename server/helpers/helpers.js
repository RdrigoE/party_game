import { readFileSync } from 'fs';

function selectRandomTopic(filename) {
    const data = readFileSync(filename, 'utf8');
    const topics = JSON.parse(data).topics;
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
}

function chooseTwoValues(elemList) {
    let elem1;
    let elem2;
    const first_pos = Math.floor(Math.random() * elemList.length)
    elem1 = elemList[first_pos];
    do {
        const second_pos = Math.floor(Math.random() * elemList.length)
        elem2 = elemList[second_pos];
    } while (elem1 === elem2);
    return { first: elem1, second: elem2 }
}


export { selectRandomTopic, chooseTwoValues }