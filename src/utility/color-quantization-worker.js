import { kmeans } from "./kmeans"

addEventListener("message", (event) => {
    const { data, k } = event.data
    kmeans(data, k, 1000, (centroids, clusters, iteration, finished, converged) => {
        if(iteration % 10 == 0 || finished) {
            postMessage({centroids, clusters, iteration, finished, converged})
        }
    })
})