const EPS = 1e-6;
const disToScreen = 10;

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
    const thetaStep: number = Math.PI * 0.05;
    while (2*Math.PI - start > EPS) {
        let x: number = radius*Math.cos(start);
        let y: number = radius*Math.sin(start);
        start += thetaStep;
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

function renderingTorus(ctx: CanvasRenderingContext2D, xAngle: number, zAngle: number) {
    const cx: number = ctx.canvas.width * 0.5;
    const cy: number = ctx.canvas.height * 0.5;
    const central: Vector3 = new Vector3(cx, cy, 0);
    const r2: Vector3 = new Vector3(150, 0, 0);

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

    let r1 = 100;
    while (r1 <= 100) {
        let start = 0;
        while (2*Math.PI - start > EPS) {
            for (let p of circleIter(r1)) {
                let np: Vector3 = p.clone().norm();
                p.add(r2);
                const rotateMat = [
                    new Vector3(Math.cos(start), 0, -Math.sin(start)),
                    new Vector3(0, 1, 0),
                    new Vector3(Math.sin(start), 0, Math.cos(start)),
                ];
                p = matrixFactor(p, rotateMat);
                p = matrixFactor(p, rotateMatX);
                p = matrixFactor(p, rotateMatZ);
                np = matrixFactor(np, rotateMat);
                np = matrixFactor(np, rotateMatX);
                np = matrixFactor(np, rotateMatZ);
                const rp = p.clone().add(central);

                const light: Vector3 = new Vector3(-1, 0, 1).norm();
                const L = np.dot(light);
                // const L = (np.dot(light) + 1) * 0.5;
                if (L > 0) {
                    fillCircle(ctx, rp.x, rp.y, 2.5, L);
                }
            }
            start += Math.PI * 0.05;
        }
        r1 += 10;
    }
}

(() => {
    const ctx = initCanvas();
    // renderingTorus(ctx, Math.PI*0.25, Math.PI*0.25);
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
        zAngle += Math.PI * 0.2 * deltaTime;
        xAngle += Math.PI * 0.4 * deltaTime;
        if (zAngle >= Math.PI * 2) zAngle -= Math.PI*2;
        if (xAngle >= Math.PI * 2) xAngle -= Math.PI*2;
        renderingTorus(ctx, xAngle, zAngle);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
})();
