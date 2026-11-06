const { performance } = require('perf_hooks');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSimulated(id) {
    await delay(200); // Simulate 200ms network latency
    return { count: 10 };
}

async function sequential() {
    const start = performance.now();

    // 1. My Clients count
    const result1 = await fetchSimulated(1);

    // 2. Unread messages
    const result2 = await fetchSimulated(2);

    const end = performance.now();
    return end - start;
}

async function concurrent() {
    const start = performance.now();

    const [result1, result2] = await Promise.all([
        fetchSimulated(1),
        fetchSimulated(2)
    ]);

    const end = performance.now();
    return end - start;
}

async function runBenchmark() {
    console.log("Running benchmark...");

    const seqTime = await sequential();
    console.log(`Sequential execution time: ${seqTime.toFixed(2)}ms`);

    const concTime = await concurrent();
    console.log(`Concurrent execution time: ${concTime.toFixed(2)}ms`);

    const improvement = seqTime - concTime;
    const improvementPercent = (improvement / seqTime) * 100;

    console.log(`Improvement: ${improvement.toFixed(2)}ms (${improvementPercent.toFixed(2)}%)`);
}

runBenchmark();
