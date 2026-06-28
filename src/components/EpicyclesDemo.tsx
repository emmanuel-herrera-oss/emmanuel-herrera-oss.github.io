import { useRef, useState } from "preact/hooks"

export function EpicyclesDemo() {
	const [isDrawing, setIsDrawing] = useState(false);
	const [desiredEstimateSize, setDesiredEstimateSize] = useState(1);
	const desiredEstimateSizeRef = useRef(1);
	const estimates = useRef<Complex[]>([]);
	const points = useRef<Complex[]>([]);
	const coefficients = useRef<Array<Complex>>([]);
	const n = useRef(1);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const showAnimation = useRef(false);

	const reset = () => {
		showAnimation.current = false;
		estimates.current = [];
		points.current = [];
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = "black";
	}
	const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>): void => {
		const canvas = e.currentTarget;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		setIsDrawing(true);
		const { x, y } = getCoordinates(canvas, e);
		ctx.beginPath();
		ctx.moveTo(x, y);
		points.current.push(new Complex(x, y));
	};
	const draw = (e: React.PointerEvent<HTMLCanvasElement>): void => {
		if (!isDrawing) return;

		const canvas = e.currentTarget;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { x, y } = getCoordinates(canvas, e);
		ctx.lineTo(x, y);
		ctx.stroke();
		points.current.push(new Complex(x, y));
	};
	const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		setIsDrawing(false);
		coefficients.current = dft(points.current);
		desiredEstimateSizeRef.current = points.current.length;
		setDesiredEstimateSize(points.current.length);
		const canvas = e.currentTarget;
		showAnimation.current = true;
		requestAnimationFrame((t) => drawFrame(t, canvas));
	};
	const startTime = useRef<DOMHighResTimeStamp>();
	const drawFrame = (currentTime: DOMHighResTimeStamp, canvas: HTMLCanvasElement): void => {
		if(showAnimation.current == false) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!startTime.current) {
			startTime.current = currentTime;
			requestAnimationFrame((t) => drawFrame(t, canvas));
			return;
		}

		// 5 seconds per drawing, max
		if (currentTime < startTime.current + n.current * (5000 / points.current.length)) {
			requestAnimationFrame((t) => drawFrame(t, canvas));
			return;
		}

		// Rotate vectors according to current point n.
		const vectors = new Array<Complex>();
		for (let k = 0; k < coefficients.current.length; k++) {
			//From IDFT: vectors[i] = 1 / N * e^(2*pi*k*n / N)
			vectors.push(coefficients.current[k].times(new Complex(1 / coefficients.current.length, 0))
				.times(new Complex(Math.cos(2 * Math.PI * k * n.current / coefficients.current.length),
					Math.sin(2 * Math.PI * k * n.current / coefficients.current.length))));
		}
		vectors.sort((a, b) => b.abs() - a.abs()); // Sort so that when we estimate using fewer than N vectors, get the best estimate.

		// Draw the original line that was drawn
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = "black";
		ctx.beginPath();
		for (let i = 0; i < points.current.length - 1; i++) {
			ctx.moveTo(points.current[i].re, points.current[i].im);
			ctx.lineTo(points.current[i + 1].re, points.current[i + 1].im);
			ctx.stroke();
		}

		// Draw the first {desiredEstimateSize} rotated vectors and esimate point n based on their sum
		let prev_head_x = 0, prev_head_y = 0;
		const estimateSize = desiredEstimateSizeRef.current;
		for (let k = 0; k < estimateSize; k++) {
			ctx.strokeStyle = "blue";
			const head_x = prev_head_x + vectors[k].re;
			const head_y = prev_head_y + vectors[k].im;

			// Don't draw the first (non-rotating) DC vector
			if (k > 0) {
				ctx.beginPath();
				ctx.moveTo(prev_head_x, prev_head_y);
				ctx.lineTo(head_x, head_y);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(prev_head_x, prev_head_y, vectors[k].abs(), 0, 2 * Math.PI);
				ctx.stroke();
			}

			prev_head_x = head_x;
			prev_head_y = head_y;

			if (k == estimateSize - 1) {
				estimates.current.push(new Complex(head_x, head_y));
			}
		}

		// Draw the estimated line
		ctx.strokeStyle = "red";
		ctx.beginPath();
		for (let i = 0; i < estimates.current.length - 1; i++) {
			ctx.moveTo(estimates.current[i].re, estimates.current[i].im);
			ctx.lineTo(estimates.current[i + 1].re, estimates.current[i + 1].im);
			ctx.stroke();
		}
		n.current++;
		if (n.current >= points.current.length) {
			n.current = 0;
			startTime.current = currentTime;
		}
		requestAnimationFrame((t) => drawFrame(t, canvas));
	};

	const changeEstimateSize = function(newCount: number) {
		desiredEstimateSizeRef.current = newCount;
		setDesiredEstimateSize(newCount);
		estimates.current = [];
		n.current = 0;
	}

	return <div style={{ width: '640px', display: 'flex', flexDirection: 'column', maxWidth: '90vw' }}>
		<canvas
			ref={canvasRef}
			width="640"
			height="480"
			onPointerDown={startDrawing}
			onPointerUp={stopDrawing}
			onPointerMove={draw}
			style={{ border: '3px solid black', margin: '0.5rem 0 0.5rem 0' }}>Your browser does not support the HTML canvas tag.</canvas>
		<label for="count">Estimate size: {desiredEstimateSize - 1}/{points.current.length - 1}</label>
		<input type="range" min={2} max={points.current.length} step={1} value={desiredEstimateSizeRef.current} onInput={(e) => changeEstimateSize(Number(e.currentTarget.value))} />
		<button onClick={reset}>Reset</button>
	</div>
}

const getCoordinates = (canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) => {
	const rect = canvas.getBoundingClientRect();
  
  // Calculate raw click position relative to the element box
  const relativeX = e.clientX - rect.left;
  const relativeY = e.clientY - rect.top;

  // Scale the coordinates to match the internal drawing buffer
  return {
    x: relativeX * (canvas.width / rect.width),
    y: relativeY * (canvas.height / rect.height)
  };
}

class Complex {
	re: number;
	im: number;

	constructor(re: number, im: number) {
		this.re = re;
		this.im = im;
	}

	times(other: Complex): Complex {
		const realPart = this.re * other.re - this.im * other.im;
		const imagPart = this.im * other.re + this.re * other.im;
		return new Complex(realPart, imagPart);
	}
	plus(other: Complex): Complex {
		return new Complex(this.re + other.re, this.im + other.im);
	}
	abs(): number {
		return Math.sqrt(this.re * this.re + this.im * this.im);
	}
};


function dft(x: Complex[]) {
	const N = x.length;
	const c: Complex[] = [];
	for (let k = 0; k < N; k++) {
		let sum = new Complex(0, 0);
		for (let n = 0; n < N; n++) {
			const exp = new Complex(Math.cos(-2 * Math.PI * k * n / N), Math.sin(-2 * Math.PI * k * n / N));
			sum = sum.plus(x[n].times(exp));
		}
		c.push(sum);
	}
	return c;
};
