const SCREEN_FACTOR = 60;
const SCREEN_WIDTH = 16*SCREEN_FACTOR;
const SCREEN_HEIGHT = 9*SCREEN_FACTOR;
const EPS = 1e-6;
const disToScreen = 10;
const zAxisSpeed = Math.PI * 0.2;
const xAxisSpeed = Math.PI * 0.4;
const thetaSpacing = Math.PI * 0.05;
const phiSpacing = Math.PI * 0.05;
const R1 = 250;
const R2 = 300;
const NEAR_CLIPPING_PLANE = 10;
const FAR_CLIPPING_PLANE = 30;

class Vector3 {
    x: number;
    y: number;
    z: number;

    static zero() {
        return new Vector3(0, 0, 0);
    }

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    array() {
        return [this.x, this.y, this.z];
    }

    add(that: Vector3): Vector3 {
        this.x += that.x;
        this.y += that.y;
        this.z += that.z;
        return this;
    }

    sub(that: Vector3): Vector3 {
        this.x -= that.x;
        this.y -= that.y;
        this.z -= that.z;
        return this;
    }

    length(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    scale(factor: number): Vector3 {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;
        return this;
    }

    norm(): Vector3 {
        const len = this.length();
        this.x /= len;
        this.y /= len;
        this.z /= len;
        return this;
    }

    dot(that: Vector3): number {
        return this.x*that.x + this.y*that.y + this.z*that.z;
    }

    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    copy(that: Vector3): Vector3 {
        this.x = that.x;
        this.y = that.y;
        this.z = that.z;
        return this;
    }
}

function initCanvas(): CanvasRenderingContext2D {
    const screen = document.getElementById("screen") as (HTMLCanvasElement | null);
    if (screen == null) {
        throw new Error("No canvas element with ID 'screen'");
    }
    screen.width = 16*80;
    screen.height = 9*80;
    const ctx = screen.getContext("2d");
    if (ctx == null) {
        throw new Error("2D rendering canvas context not supported");
    }
    return ctx;
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, brightness: number) {
    ctx.beginPath();
    ctx.fillStyle = `rgb(${255*brightness}, ${255*brightness}, ${255*brightness})`;
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill();
}

function* circleIter(radius: number): Generator<Vector3> {
    let start: number = 0;
    while (2*Math.PI - start > EPS) {
        let x: number = radius*Math.cos(start);
        let y: number = radius*Math.sin(start);
        start += phiSpacing;
        yield new Vector3(x, y, 0);
    }
}

function matrixFactor(v: Vector3, mat: Array<Vector3>): Vector3 {
    if (mat.length !== 3) {
        throw new Error("Only support 3d vector now.");
    }
    return new Vector3(
        v.dot(mat[0]!),
        v.dot(mat[1]!),
        v.dot(mat[2]!),
    );
}

function renderingTorus(ctx: CanvasRenderingContext2D,
                        backCtx: OffscreenCanvasRenderingContext2D,
                        xAngle: number, zAngle: number) {
    backCtx.reset();
    const backImageData = backCtx.getImageData(0, 0, backCtx.canvas.width, backCtx.canvas.height);
    const cx: number = backCtx.canvas.width * 0.5;
    const cy: number = backCtx.canvas.height * 0.5;
    const central: Vector3 = new Vector3(cx, cy, 0);

    const rotateMatX = [
        new Vector3(1, 0, 0),
        new Vector3(0, Math.cos(xAngle), -Math.sin(xAngle)),
        new Vector3(0, Math.sin(xAngle), Math.cos(xAngle)),
    ];

    const rotateMatZ = [
        new Vector3(Math.cos(zAngle), -Math.sin(zAngle), 0),
        new Vector3(Math.sin(zAngle), Math.cos(zAngle), 0),
        new Vector3(0, 0, 1),
    ];


    const r2: Vector3 = new Vector3(R2, 0, 0);
    const light: Vector3 = new Vector3(-1, 0, -1).norm();
    for (const p of circleIter(R1)) {
        let start = 0;
        while (2*Math.PI - start > EPS) {
            let tp = p.clone();
            let np = p.clone().norm();
            const rotateMat = [
                new Vector3(Math.cos(start), 0, -Math.sin(start)),
                new Vector3(0, 1, 0),
                new Vector3(Math.sin(start), 0, Math.cos(start)),
            ];
            tp.add(r2);
            np = matrixFactor(np, rotateMat);
            np = matrixFactor(np, rotateMatX);
            np = matrixFactor(np, rotateMatZ);
            tp = matrixFactor(tp, rotateMat);
            tp = matrixFactor(tp, rotateMatX);
            tp = matrixFactor(tp, rotateMatZ);
            tp.scale(NEAR_CLIPPING_PLANE/FAR_CLIPPING_PLANE);
            tp.add(central);
            const px: number = Math.floor(tp.x)
            const py: number = Math.floor(tp.y)
            const L = np.dot(light);
            const index = (py*backCtx.canvas.width + px)*4;
            if (L > 0) {
                backImageData.data[index + 0] = 255 * L;
                backImageData.data[index + 1] = 255 * L;
                backImageData.data[index + 2] = 255 * L;
                backImageData.data[index + 3] = 255;
            }
            start += thetaSpacing;
        }
    }

    backCtx.putImageData(backImageData, 0, 0);
    ctx.drawImage(backCtx.canvas,
                  0, 0, backCtx.canvas.width, backCtx.canvas.height,
                  0, 0, ctx.canvas.width, ctx.canvas.height);
}

(() => {
    const ctx = initCanvas();
    const backCanvas: OffscreenCanvas = new OffscreenCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
    const backCtx = backCanvas.getContext("2d");
    if (backCtx == null) {
        throw new Error("OffscreenCanvas not supported.");
    }
    ctx.imageSmoothingEnabled = false;
    backCtx.imageSmoothingEnabled = false;
    if (backCtx == null) {
        throw new Error("2D OffscreenCanvas context not supported.");
    }

    let start: number|undefined = undefined;
    let previous: number|undefined = undefined;
    let xAngle = 0;
    let zAngle = 0;

    const step = (timestamp: number) => {
        ctx.reset();
        ctx.fillStyle="#151515";
        ctx.fillRect(0, 0, screen.width, screen.height);
        if (start === undefined) start = timestamp;
        if (previous === undefined) previous = timestamp;
        const deltaTime: number = (timestamp - previous) / 1000;
        previous = timestamp;
        zAngle += zAxisSpeed * deltaTime;
        xAngle += xAxisSpeed * deltaTime;
        if (zAngle >= Math.PI * 2) zAngle -= Math.PI*2;
        if (xAngle >= Math.PI * 2) xAngle -= Math.PI*2;
        renderingTorus(ctx, backCtx, xAngle, zAngle);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
})();
