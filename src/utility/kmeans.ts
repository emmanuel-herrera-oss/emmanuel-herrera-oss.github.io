/**
 * @param input Array of Vectors. Last element in each vector is an optional identifier. 
 * @param numberOfClusters 'k' in 'k-means' clustering
 * @param iterationLimit Stop if not converged after this many iterations
 * @param notify A function that's called on every iteration with the current clusters and centroids
 */
export function kmeans(
        input: number[][], 
        numberOfClusters: number, 
        iterationLimit: number = 1000,
        notify: (centroids: number[][], clusters: number[][][], iteration: number, finished: boolean, converged: boolean) => void) {
    let clusters: number[][][] = []
    let centroids: number[][]

    centroids = initCentroids(input, numberOfClusters)
    let converged = false
    let iterationCount = 0
    for (let i = 0; i < iterationLimit; i++) {
        iterationCount++
        clusters = initClusters(numberOfClusters)
        for (let j = 0; j < input.length; j++) {
            const point = input[j]
            let min = -1
            let minIdx = -1
            for (let k = 0; k < centroids.length; k++) {
                const d = vectorDistance(point, centroids[k])
                if (min == -1 || d < min) {
                    min = d
                    minIdx = k
                }
            }
            clusters[minIdx].push(point)
        }
        const newCentroids = updateCentroids(clusters)
        let allEqual = true
        for (let i = 0; i < centroids.length; i++) {
            if (newCentroids.findIndex(c => vectorEquals(c, centroids[i])) == -1) {
                allEqual = false
                break
            }
        }
        if (allEqual) {
            converged = true
            break
        }
        centroids = newCentroids
        notify(centroids, clusters, i, false, false)
    }
    notify(centroids, clusters, iterationCount, true, converged)
}

// Initialize k centroids from k random samples of the input data
function initCentroids(input: number[][], numberOfClusters: number) {
    const centroids: number[][] = new Array(numberOfClusters)
    for (let i = 0; i < numberOfClusters; i++) {
        while(!centroids[i] || centroids.findIndex((c, j) => c && i != j && vectorEquals(c, centroids[i])) > -1) {
            const randIndex = Math.floor(Math.random() * input.length)
            centroids[i] = input[randIndex]
        }
    }
    return centroids
}

// Return k centroids that are the average of the vectors in each cluster
function updateCentroids(clusters: number[][][]) {
    let newCentroids: number[][] = []
    for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].length == 0) {
            continue;
        }
        const newCentroid = new Array(clusters[i][0].length).fill(0)
        for (let j = 0; j < clusters[i].length; j++) {
            vectorAdd(newCentroid, clusters[i][j])
        }
        vectorDivide(newCentroid, clusters[i].length)
        newCentroids.push(newCentroid)
    }
    return newCentroids
}

function initClusters(numberOfClusters: number) {
    const clusters: number[][][] = new Array(numberOfClusters)
    for (let i = 0; i < numberOfClusters; i++) {
        clusters[i] = []
    }
    return clusters
}

function vectorEquals(v1: number[], v2: number[]) {
    if(v1.length != v2.length) {
        return false
    }
    for(let i = 0;i < v1.length - 1;i++) {
        if(v1[i] !== v2[i]) {
            return false
        }
    }
    return true
}
function vectorDistance(v1: number[], v2: number[]) {
    let sum = 0
    if(v1.length != v2.length) {
        throw new Error('Cannot compute distance of vectors of different lengths')
    }
    for (let i = 0; i < v1.length - 1; i++) {
        sum += (v1[i] - v2[i]) * (v1[i] - v2[i])
    }
    return Math.sqrt(sum)
}
function vectorAdd(v1: number[], v2: number[]) {
    if(v1.length != v2.length) {
        throw new Error('Cannot add vectors of different lengths')
    }
    for(let i = 0;i < v1.length - 1;i++) {
        v1[i] += v2[i]
    }
}
function vectorDivide(v: number[], d: number) {
    for(let i = 0;i < v.length - 1;i++) {
        v[i] /= d
    }
}