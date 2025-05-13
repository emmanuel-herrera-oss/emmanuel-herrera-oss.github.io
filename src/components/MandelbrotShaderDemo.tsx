import { useEffect, useRef, useState } from "preact/hooks"

const MaxWidth = 640
const NormalizedInitialWidth = 2.47
const NormalizedInitialHeight = 2.24
const InitialZoom = 1.05
const InitialNormalizedX = -0.765
const InitialNormalizedY = 0
const InitialMaxIterations = 1000
const ZoomExponentialScaleFactor = 0.0001

const VertexShaderSource = `
    #version 100
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
`

const FragmentShaderSource = `
    #version 100
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_zoom;
    uniform vec2 u_center;
    uniform int u_max_iterations;
    void main() {
        float w = ${NormalizedInitialWidth} / u_zoom;
        float h = ${NormalizedInitialHeight} / u_zoom;
        float x0 = u_center.x - w / 2.0;
        float y0 = u_center.y - h / 2.0;
        vec2 c = vec2((w / u_resolution.x) * gl_FragCoord.x + x0, (h / u_resolution.y) * gl_FragCoord.y + y0);
        vec2 z = vec2(0.0);
        int iterations;
        int i;
        for (int i = 0; i < 10000; i++) {
            z = vec2(
                z.x * z.x - z.y * z.y + c.x,
                2.0 * z.x * z.y + c.y
            );
            if(dot(z, z) > 4.0) {
                break;
            }
            iterations = i;
            if(i >= u_max_iterations) {
                break;
            }
        }
        float color = sqrt(float(u_max_iterations/100) * (float(iterations) / float(u_max_iterations)));
        if(iterations >= u_max_iterations - 1) {
            color = 0.0;
        }
        gl_FragColor = vec4(vec3(color), 1.0);
    }
`

export function MandelbrotShaderDemo() {
    const gl = useRef<WebGLRenderingContext | null>(null);
    const program = useRef<WebGLProgram | null>(null);
    const [zoom, setZoom] = useState(InitialZoom);
    const [x0, setX0] = useState(InitialNormalizedX)
    const [y0, setY0] = useState(InitialNormalizedY)
    const [maxIterations, setMaxIterations] = useState(InitialMaxIterations)

    // Initialization
    useEffect(() => {
        // Resize the canvas while maintaining aspect ratio 
        const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement
        const container = document.getElementById('shader-container')
        console.log(container)
        canvas.width = Math.min(MaxWidth, container?.clientWidth ?? MaxWidth)
        canvas.height = canvas.width * (NormalizedInitialHeight / NormalizedInitialWidth)
        gl.current = canvas.getContext('webgl')
        if (!gl.current) {
            alert('Could not get context.')
            return
        }
        
        // Initialize WebGL
        program.current = gl.current.createProgram();

        // Initialize shaders
        const vertexShader = gl.current.createShader(gl.current.VERTEX_SHADER);
        const fragmentShader = gl.current.createShader(gl.current.FRAGMENT_SHADER);
        if (!program.current || !vertexShader || !fragmentShader) {
            alert('Failed to initialize shaders')
            return
        }
        gl.current.shaderSource(vertexShader, VertexShaderSource);
        gl.current.shaderSource(fragmentShader, FragmentShaderSource);
        gl.current.compileShader(vertexShader);
        gl.current.compileShader(fragmentShader);
        gl.current.attachShader(program.current, vertexShader);
        gl.current.attachShader(program.current, fragmentShader);
        gl.current.linkProgram(program.current);
        gl.current.useProgram(program.current);

        // Vertices of 2 triangles that cover the whole screen
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);

        // Copy the vertices to an array buffer
        const positionBuffer = gl.current.createBuffer();
        gl.current.bindBuffer(gl.current.ARRAY_BUFFER, positionBuffer);
        gl.current.bufferData(gl.current.ARRAY_BUFFER, positions, gl.current.STATIC_DRAW);

        // Initialize vertex shader a_position attribute based on triangle vertices
        const posLoc = gl.current.getAttribLocation(program.current, "a_position");
        gl.current.enableVertexAttribArray(posLoc);
        gl.current.vertexAttribPointer(posLoc, 2, gl.current.FLOAT, false, 0, 0);

        // Initialize canvas size - used by shader to convert from canvas coordinates to fractal coordinates
        const uResLoc = gl.current.getUniformLocation(program.current, "u_resolution");
        gl.current.uniform2f(uResLoc, canvas.width, canvas.height);
    }, [])

    // Update GL variables based on React state and redraw the canvas
    useEffect(() => {
        if(!gl.current || !program.current) return
        const centerLoc = gl.current.getUniformLocation(program.current, "u_center");
        gl.current.uniform2f(centerLoc, x0, y0);
        const zoomLoc = gl.current.getUniformLocation(program.current, "u_zoom");
        gl.current.uniform1f(zoomLoc, zoom);
        const maxIterationsLoc = gl.current.getUniformLocation(program.current, "u_max_iterations")
        gl.current.uniform1i(maxIterationsLoc, maxIterations)

        gl.current.drawArrays(gl.current.TRIANGLES, 0, 6);
    }, [zoom, x0, y0, maxIterations])

    // When mouse is clicked, center the fractal view on the cursor position. 
    function recenter(e: MouseEvent) {
        const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        // How far is the click from the canvas center?
        const offsetX = x - (canvas.width / 2)
        const offsetY = y - (canvas.height / 2)
        // Scale the distance above based on the fractal/canvas dimensions and update fractal center accordingly
        const fractalWidth = NormalizedInitialWidth / zoom
        const fractalHeight = NormalizedInitialHeight / zoom
        setX0(prev => (fractalWidth/canvas.width) * offsetX + prev)
        setY0(prev => -(fractalHeight/canvas.height) * offsetY + prev)
    }
    // Update zoom based on wheel scroll, but don't scroll the page. 
    function scrollZoom(e: any) {
        setZoom((z) => Math.max(z - (Math.exp(z * ZoomExponentialScaleFactor) * e.deltaY), 1))
        e.preventDefault()
        return false
    }
    // Reset to initial view
    function reset() {
        setZoom(InitialZoom)
        setX0(InitialNormalizedX)
        setY0(InitialNormalizedY)
        setMaxIterations(InitialMaxIterations)
    }

    // Update zoom based on pinch on touch devices
    const previousDistance = useRef(-1)
    function touchZoom(evt: TouchEvent) {
        const touches = evt.changedTouches;
        if(touches.length == 2) {
            const dx = touches[0].clientX - touches[1].clientX
            const dy = touches[0].clientY - touches[1].clientY
            const d = Math.sqrt(dx * dx + dy * dy)
            if(previousDistance.current == -1){
                previousDistance.current = d
            }
            else {
                const diff = d - previousDistance.current
                setZoom((z) => Math.max(z + (Math.exp(z * ZoomExponentialScaleFactor) * diff * 0.02), 1))
                previousDistance.current = d
            }  
        }
        evt.preventDefault()
        return false
      }
      function touchEnd() {
        previousDistance.current = -1
      }
      

    return <div id="shader-container" style={{ width: '100%', maxWidth: MaxWidth }}>
        <canvas id="shader-canvas" onClick={recenter} onWheel={scrollZoom} onTouchEnd={touchEnd} onTouchMove={touchZoom}></canvas>
        Max Iterations:
        <input id="one-hundred" type="radio" value={100} checked={maxIterations == 100} onChange={() => setMaxIterations(100)}/>
        <label for="one-hundred">100</label>
        <input id="one-thousand" type="radio" value={1000} checked={maxIterations == 1000} onChange={() => setMaxIterations(1000)}/>
        <label for="one-thousand">1,000</label>
        <input id="ten-thousand" type="radio" value={10000} checked={maxIterations == 10000} onChange={() => setMaxIterations(10000)}/>
        <label for="ten-thousand">10,000</label>
        <br/><br/>
        <input type="button" onClick={reset} value="Reset" />
    </div>
}