const EPS = 1e-6;
const disToScreen = 10;

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

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill();
}

function* circleIter(radius: number): Generator<[number, number]> {
    let start: number = 0;
    const thetaStep: number = Math.PI * 0.05;
    while (2*Math.PI - start > EPS) {
        let x: number = radius*Math.cos(start);
        let y: number = radius*Math.sin(start);
        start += thetaStep;
        yield [x, y];
    }
}

function matrixFactor(v: Array<number>, mat: Array<Array<number>>): Array<number> {
    let res: Array<number> = new Array<number>();
    const cols = v.length;
    const mRows = mat.length;
    const mCols = mat[0]?.length;
    if (mCols == null) {
        throw new Error("Undefined matrix");
    }
    if (mRows !== cols) {
        throw new Error("Vector does not match with matrix");
    }
    for (let i = 0; i < mCols; i++) {
        let tmp: number = 0;
        for (let j = 0; j < mRows; j++) {
            tmp += v[j] * mat[j][i];
        }
        res.push(tmp);
    }
    return res;
}

function renderingTorus(ctx: CanvasRenderingContext2D, xAngle: number, zAngle: number) {
    const cx: number = ctx.canvas.width * 0.5;
    const cy: number = ctx.canvas.height * 0.5;
    const r2 = 200;

    const rotateMatX = [
        [1, 0, 0],
        [0, Math.cos(xAngle), Math.sin(xAngle)],
        [0, -Math.sin(xAngle), Math.cos(xAngle)]
    ];

    const rotateMatZ = [
        [Math.cos(zAngle), Math.sin(zAngle), 0],
        [-Math.sin(zAngle), Math.cos(zAngle), 0],
        [0, 0, 1],
    ];

    ctx.fillStyle = "white";
    let r1 = 100;
    while (r1 <= 100) {
        let start = 0;
        while (2*Math.PI - start > EPS) {
            for (const [dx, dy] of circleIter(r1)) {
                let tx = r2 + dx
                let ty = dy;
                const rotateMat = [
                    [Math.cos(start), 0, Math.sin(start)],
                    [0, 1, 0],
                    [-Math.sin(start), 0, Math.cos(start)]
                ];
                const [ryx, ryy, ryz] = matrixFactor([tx, ty, 0], rotateMat);
                const [rxx, rxy, rxz] = matrixFactor([ryx, ryy, ryz], rotateMatX);
                const [rzx, rzy, rzz] = matrixFactor([rxx, rxy, rxz], rotateMatZ);

                const x = rzx + cx;
                const y = rzy + cy;
                fillCircle(ctx, x, y, 1);
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
        const delta: number = (timestamp - previous) / 1000;
        previous = timestamp;
        zAngle += Math.PI * 0.2 * delta;
        xAngle += Math.PI * 0.4 * delta;
        if (zAngle >= Math.PI * 2) zAngle -= Math.PI*2;
        if (xAngle >= Math.PI * 2) xAngle -= Math.PI*2;
        renderingTorus(ctx, xAngle, zAngle);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
})();
