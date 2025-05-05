import { useEffect, useState } from "preact/hooks"

export function KMeansDemo() {
    const [ centroids, setCentroids ] = useState<number[][]>([])
    const [ centers, setCenters ] = useState<number[][]>([])
    useEffect(() => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement
        canvas.width = Math.min(480, Number(document.getElementById('k-means-demo')?.clientWidth))
        canvas.height = canvas.width
    }, [])
    let reset = () => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement
        const n = 320
        const noiseFactor = 200
        const data: number[][] = new Array()
        const centers = [
            [0.25 * canvas.width, 0.25 * canvas.height], 
            [0.75 * canvas.width, 0.25 * canvas.height],
            [0.25 * canvas.width, 0.75 * canvas.height],
            [0.75 * canvas.width, 0.75 * canvas.height]
        ]
        setCenters(centers)
        for(let i = 0;i < n;i++) {
            const center = centers[Math.floor(i / n * 4)]
            data.push([
                center[0] + (Math.random() - 0.5) * noiseFactor,
                center[1] + (Math.random() - 0.5) * noiseFactor,
                i
            ])
        }
        let csv = ''
        for(let i = 0;i < data.length;i++) {
            csv = csv.concat(data[i].map(x => Math.round(x)).join(',')).concat('\n')
        }
        console.log(csv)
        const worker = new Worker(new URL("../utility/color-quantization-worker.js", import.meta.url), {type: 'module'})
        worker.addEventListener("message", (e) => {
            const { centroids, clusters } = e.data
            const colors = [
                [255, 0, 0],
                [0, 255, 0],
                [0, 0, 255],
                [255, 0, 255]
            ]
            const ctx = canvas.getContext('2d')
            if(!ctx) {
                throw new Error('Could not get 2d context')
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            for(let i = 0;i < clusters.length;i++) {
                const centroid = centroids[i]
                const cluster = clusters[i]
                ctx.strokeStyle = `rgba(${colors[i][0]}, ${colors[i][1]}, ${colors[i][2]}, 255)`
                ctx.strokeText('X', centroid[0], centroid[1], 20)
                ctx.fillStyle = `rgba(${colors[i][0]}, ${colors[i][1]}, ${colors[i][2]}, 255)`
                for(let j = 0;j < cluster.length;j++) {
                    ctx.fillRect(cluster[j][0] - 2, cluster[j][1] - 2, 4, 4)
                }
            }
            setCentroids(centroids)
        })
        worker.postMessage({data, k: 4})
    }
    return <div id="k-means-demo" style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480}}>    
    <canvas style={{alignSelf: 'start', border: '1px solid black'}} id="canvas" width={0} height={0}></canvas>
    <input onClick={reset} type="button" value="Reset"/>
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
        {centers.sort((a,b) => a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]).map((c, i) => <div>Center {i + 1}: {Math.round(c[0])}, {Math.round(c[1])}</div>)}
    </div>
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
        {centroids.sort((a,b) => a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]).map((c, i) => <div>Centroid {i + 1}: {Math.round(c[0])}, {Math.round(c[1])}</div>)}    
    </div>
</div>
}