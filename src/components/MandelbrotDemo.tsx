import { useEffect, useState } from "preact/hooks"

const MaxWidth = 640
const MaxIterations = 1000

export function MandelbrotDemo() {
    const [ processed, setProcessed ] = useState(0)
    
    useEffect(() => {
        update()
    }, [])

    const update = () => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement
        const context = canvas.getContext('2d')
        if(!context) {
            alert('Could not get context.')
            return
        }
        const container = document.getElementById('container')
        canvas.width = Math.min(MaxWidth, container?.clientWidth ?? MaxWidth)
        canvas.height = canvas.width * (2.24 / 2.47)

        const start = new Date()
        for(let y = 0;y < canvas.height;y++) {
            for(let x = 0;x < canvas.width;x++) {
                const xScaled = (2.47 / canvas.width) * x - 2
                const yScaled = (2.24 / canvas.height) * y - 1.12
                const z = new Complex()
                const c = new Complex(xScaled, yScaled)
                let i = 0;
                while(i++ < MaxIterations) {
                    z.square()
                    z.add(c)
                    if(z.magnitudeSquared() > 4) {
                        break
                    }
                }
                const factor = Math.sqrt(10 * (i / MaxIterations))
                const color = (i == MaxIterations + 1) ? 0 : 255 * factor
                //const color = 255 * factor
                context.fillStyle = `rgba(${color}, ${color}, ${color}, 255)`
                context.fillRect(x, y, 1, 1)
            }
        }
        const end = new Date()
        setProcessed(end.getTime() - start.getTime())
    }

    return <div id="container" style={{width: '100%', maxWidth: MaxWidth}}>
        <canvas id="canvas"></canvas>
        {processed > 0 && <p>Processed in: {processed} ms.</p>}
        <input type="button" onClick={update} value="Again"/>
    </div>
}

class Complex {
    real = 0
    im = 0
    constructor(real: number = 0, im: number = 0) {
        this.real = real
        this.im = im
    }
    magnitudeSquared = () => {
        return (this.real * this.real + this.im * this.im)
    }
    add = (other: Complex) => {
        this.real += other.real
        this.im += other.im
    }
    square = () => {
        const r = this.real
        const i = this.im
        this.real = r * r - i * i
        this.im = 2 * r * i
    }
}