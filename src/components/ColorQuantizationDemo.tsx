import type { CSSProperties } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

const MaxWidth = 480

export function ColorQuantizationDemo() {
    const [k, setK] = useState(8)
    const [file, setFile] = useState<File|undefined>()
    const [loading, setLoading] = useState(false)
    const [processingTime, setProcessingTime] = useState<number | undefined>()
    const [palette, setPalette] = useState<number[][]>([])
    const [iteration, setIteration] = useState(0)
    
    let changeFile = (f: Event) => {
        const file = (f.target as HTMLInputElement).files?.[0];
        setFile(file)
    }
    let changeK = (e: Event) => {
        setK(Number((e.target as HTMLInputElement).value))
    }
    let quantize = () => {
        if(!file) {
            return
        }
        var img = new Image();
        img.onload = () => {
            // Load image into a canvas of the right size so we can process the pixel data
            const inCanvas = document.getElementById('in-canvas') as HTMLCanvasElement
            inCanvas.width = Math.min(MaxWidth, Number(document.getElementById('color-quantization-demo')?.clientWidth))
            inCanvas.height = inCanvas.width * img.height / img.width
            const inContext = inCanvas.getContext('2d')
            if(!inContext) {
                alert('Could not get 2d context.')
                return
            }
            inContext.drawImage(img, 0, 0, inCanvas.width, inCanvas.height)
            const source = inContext.getImageData(0, 0, inCanvas.width, inCanvas.height)

            // Put the pixel data into a format that kmeans can use. Ensure we can recover x and y from rgb[3]
            const data: number[][] = []
            const startTime = new Date()
            let i = 0
            for(let y = 0;y < inCanvas.height;y++) {
                for(let x = 0;x < inCanvas.width;x++) {
                    const rgb = [
                        source.data.at(i) ?? 0, 
                        source.data.at(i + 1) ?? 0,
                        source.data.at(i + 2) ?? 0,
                        i / 4
                    ]
                    data.push(rgb)
                    i += 4
                }
            }

            setLoading(true)
            const worker = new Worker(new URL("../utility/color-quantization-worker.js", import.meta.url), {type: 'module'})
            worker.addEventListener("message", (e) => {
                const { centroids, clusters, finished, converged, iteration } = e.data
                setProcessingTime(new Date().getTime() - startTime.getTime())
                setIteration(iteration)
                
                // Update the output canvas from the current clusters
                const outCanvas = document.getElementById('out-canvas') as HTMLCanvasElement
                outCanvas.width = inCanvas.width
                outCanvas.height = inCanvas.height
                const outContext = outCanvas.getContext('2d')
                if(!outContext) {
                    setLoading(false)
                    alert('Could not get 2d context.')
                    return
                }
                for(let i = 0;i < clusters.length;i++) {
                    const cluster = clusters[i]
                    const centroid = centroids[i]
                    outContext.fillStyle = `rgba(${centroid[0]}, ${centroid[1]}, ${centroid[2]}, 255)`
                    for(let j = 0;j < cluster.length;j++) {
                        outContext.fillRect(cluster[j][3] % outCanvas.width, Math.floor(cluster[j][3] / outCanvas.width), 1, 1)
                    }
                }
                
                setPalette(centroids)
                if(finished) {
                    setLoading(false)
                    if(!converged) {
                        alert('Did not converge')
                    }
                }
            })
            worker.postMessage({data, k})
        }
        img.onerror = (err) => {
            alert(err)
        }
        img.src = URL.createObjectURL(file);
    }
    useEffect(quantize, [k, file])
    /*useEffect(() => {
        quantize()
    }, [k, file])*/
    return (
        <div id="color-quantization-demo" style={containerStyle}>
            <input type="file" onChange={changeFile} />
            <label for="k-range">k: {k}</label>
            <input type="range" min={4} max={16} value={k} onChange={changeK}/>
            <canvas style={canvasStyle} id="in-canvas" width={0} height={0}></canvas>
            <canvas style={canvasStyle} id="out-canvas" width={0} height={0}></canvas>
            <input type="button" onClick={quantize} disabled={loading} value={loading ? "Loading..." : "Redo"}/>
            {processingTime && <p>Processed in {processingTime} milliseconds, {iteration} iterations</p>}
            <div style={paletteContainerStyle}>
                {palette.map(p => 
                    <div style={{...paletteStyle, backgroundColor: `rgba(${p[0]}, ${p[1]}, ${p[2]}, 255)`}}/>
                )}
            </div>
        </div>
    )
}

const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: 480
}

const canvasStyle: CSSProperties = {
    alignSelf: 'start'
}

const paletteContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '0.25rem'
}

const paletteStyle: CSSProperties = {
    width: 32, 
    height: 32
}