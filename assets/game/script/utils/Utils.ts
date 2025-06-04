import { __private, Component, find as cc_find, lerp, math, Node, tween, Tween, UIOpacity, UITransform, Vec3, Asset, AssetManager, Vec2, v2, v3 } from 'cc';

// 內部變量
const empty_props = {};

/**
 * 隨機整數 (範圍包含邊界)
 */
export function rInt(ia: number, ib: number): number {
    if (ia > ib) [ia, ib] = [ib, ia];
    return math.randomRangeInt(ia, ib + 1);
}

/**
 * 取得隨機元素
 */
export function rItem<T>(list: readonly T[]): T {
    return list[math.randomRangeInt(0, list.length)];
}

/**
 * 取得末位元素
 */
export function lastItem<T>(list: readonly T[]): T {
    return list[list.length - 1];
}

/**
 * 取得所有相同元素的索引值
 */
export function getIndices<T>(arr: readonly T[], val: T): number[] {
    const indices = new Array<number>();
    for (let i = 0, len = arr.length; i < len; ++i) {
        if (arr[i] === val) indices.push(i);
    }
    return indices;
}

/**
 * 數數 (從 a 數到 b, 參數均為整數)
 */
export function count(ia: number, ib: number, cb: (num: number) => void) {
    if (ia <= ib) while (ia <= ib) cb(ia), ++ia;
    else while (ia >= ib) cb(ia), --ia;
}

/**
 * 隨機洗牌 (Fisher-Yates Shuffle)
 */
export function shuffleSelf<T>(items: Array<T>): Array<T> {
    const count = items.length
    if (count >= 2) {
        const floor = Math.floor, random = Math.random
        for (let i = count - 1; i > 0; --i) {
            const j = floor(random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
    }
    return items;
}

/**
 * 轉成銀行格式的數字字串 (ex. 1234567.89 => '1,234,567.89')
 */
export function toBankNum(num: number): string {
    // 使用 % 運算符來檢查是否有小數部分 (先限制在小數點後兩位)
    if (Math.abs(num % 1) < .01) {
        const numStr = num.toFixed(0);
        if (num >= 1000) {
            return numStr.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        }
        return numStr;
    }
    else {
        const numStr = num.toFixed(2);
        const dotIndex = numStr.indexOf('.');
        const intPart = numStr.slice(0, dotIndex);
        const decPart = numStr.slice(dotIndex);
        return `${intPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}${decPart}`
    }
}

/**
 * easeIn for tween (慢到快)
 */
export function easeIn(rate: number): (t: number) => number {
    return t => Math.pow(t, rate);
}

/**
 * easeOut for tween (快到慢)
 */
export function easeOut(rate: number): (t: number) => number {
    return t => 1. - Math.pow(1. - t, rate);
}

/**
 * easeInOut for tween (慢到快, 快到慢)
 */
export function easeInOut(rate: number): (t: number) => number {
    return t => {
        const x = t * 2.;
        if (x < 1.) {
            return .5 * Math.pow(x, rate);
        }
        return 1. - (.5 * Math.pow(2. - x, rate));
    }
}

/**
 * 淡入淡出的緩動, a < 0 表示使用當前透明度 (使用節點當緩動目標, 方便繼續串接其他節點屬性)
 */
export function fadeTween(node: Node, dur: number, a: number, b: number, easing?: (t: number) => number): Tween<Node> {
    const opa = setOpacity(node, a);
    if (a < 0) a = opa.opacity;

    const currNum = !!easing ?
        (t: number) => lerp(a, b, easing(t)) :
        (t: number) => lerp(a, b, t);

    return tween(node).by(dur, empty_props, {
        onUpdate: (_, t) => opa.opacity = currNum(t)
    });
}

/**
 * 取得數值內插的緩動 (由 a 數值滾分到 b 數值)
 */
export function lerpTween<T>(target: T, dur: number, a: number, b: number, update: (num: number) => void, easing?: (t: number) => number): Tween<T> {
    const currNum = !!easing ?
        (t: number) => lerp(a, b, easing(t)) :
        (t: number) => lerp(a, b, t);

    return tween(target).by(dur, empty_props, {
        onUpdate: (_, t) => update(currNum(t))
    });
}

/**
 * 創建速度緩動函式 (傳入速度折線圖的時間點與高度)
 * ex. makeVelocityEasing([0, .3, .6, .9, 1], [3, 3, 1, 1, 0])
 */
export function makeVelocityEasing(timePoints: Readonly<number[]>, heights: Readonly<number[]>): (t: number) => number {
    const myTimePoints = Array.from(timePoints);
    const myheights = Array.from(heights);
    const myAreas = [] as number[];

    for (let i = 0, len = myTimePoints.length - 1; i < len; ++i) {
        const t0 = myTimePoints[i], t1 = myTimePoints[i + 1];
        const y0 = myheights[i], y1 = myheights[i + 1];
        const area = (y0 + y1) * (t1 - t0) * .5;    // 梯形面積
        myAreas.push(area);
    }

    const sumArea = myAreas.reduce((acc, cur) => acc + cur, 0);
    const s = 1 / sumArea;

    const easingFunc = (t: number) => {
        let accArea = 0;
        for (let i = 0, len = myAreas.length; i < len; ++i) {
            const t0 = myTimePoints[i], t1 = myTimePoints[i + 1];
            if (t < t1 && t >= t0) {
                const y0 = myheights[i], y1 = myheights[i + 1];
                const dx = (t - t0), dy = lerp(y0, y1, dx / (t1 - t0));
                const area = (y0 + dy) * dx * .5;    // 當前掠過的梯形面積
                return (accArea + area) * s;
            }
            accArea += myAreas[i];
        }
        return t;
    };

    return easingFunc;
}

/**
 * 每幀運行
 */
export function perFrame<T>(target: T, taskFunc: (task: Tween<T>) => void): Tween<T> {
    const tw = tween(target), decade = 315_360_000;
    return tw.by(decade, empty_props, { onUpdate: (_, t) => taskFunc(tw) })
        .repeatForever()
        .start();
}

/**
 * 重複運行
 */
export function repeat<T>(target: T, dt: number, times: number, taskFunc: (task: Tween<T>) => void): Tween<T> {
    const tw = tween(target);
    return tw.call(() => taskFunc(tw)).delay(Math.max(1e-7, dt))
        .union().repeat(Math.max(0, times))
        .start();
}

/**
 * 輪詢
 */
export function poll<T>(target: T, dt: number, taskFunc: (task: Tween<T>) => void): Tween<T> {
    const tw = tween(target);
    return tw.call(() => taskFunc(tw)).delay(Math.max(1e-7, dt))
        .union().repeatForever()
        .start();
}

/**
 * 延遲
 */
export function delay<T>(target: T, dt: number, taskFunc: () => void): Tween<T> {
    const tw = tween(target);
    if (dt > 0) tw.delay(dt);
    return tw.call(taskFunc)
        .start();
}

/**
 * 設定節點尺寸, 只有 w >= 0 或 h >= 0 時才會設定寬度或高度 (可透過代入負值來取得節點的 UITransform 元件)
 */
export function setUISize(node: Node, w: number | -1, h: number | -1): UITransform {
    const trans = node.getComponent(UITransform);
    const sw = w < 0 ? trans.width : w;
    const sh = h < 0 ? trans.height : h;
    if (w >= 0 || h >= 0) trans.setContentSize(sw, sh);
    return trans;
}

/**
 * 設定節點透明度, 只有 val >= 0 時才會設定透明度 (可透過代入負值來取得節點的 UIOpacity 元件)
 */
export function setOpacity(node: Node, val: number | -1): UIOpacity {
    const opa = node.getComponent(UIOpacity);
    if (val >= 0) opa.opacity = val;
    return opa;
}

/**
 * 設定節點位置 X
 */
export function setPosX(node: Node, val: number): Readonly<Vec3> {
    const p = node.position;
    node.setPosition(val, p.y, p.z);
    return node.position;
}

/**
 * 設定節點位置 Y
 */
export function setPosY(node: Node, val: number): Readonly<Vec3> {
    const p = node.position;
    node.setPosition(p.x, val, p.z);
    return node.position;
}

/**
 * 設定節點位置 Z
 */
export function setPosZ(node: Node, val: number): Readonly<Vec3> {
    const p = node.position;
    node.setPosition(p.x, p.y, val);
    return node.position;
}

/**
 * Vec3 轉 Vec2
 */
export function makeVec3ToVec2(v: Vec3, out?: Vec2): Vec2 {
    out = out ?? v2();
    return out.set(v.x, v.y);
}

/**
 * Vec2 轉 Vec3
 */
export function makeVec2ToVec3(v: Vec2, out?: Vec3): Vec3 {
    out = out ?? v3();
    return out.set(v.x, v.y, 0);
}

/**
 * 取得某位置下的元件或節點
 * @param root 節點或元件
 * @param path 路徑字串 ex. 'Canvas/Node_A/Node_B'
 * @param type 元件類型, 有帶此參數會回傳該元件
 */
export function find(path: string): Node
export function find(root: Node | Component, path: string): Node
export function find(path: string, root: Node | Component): Node
export function find<T extends Component>(path: string, type: __private._types_globals__Constructor<T>): T
export function find<T extends Component>(root: Node | Component, type: __private._types_globals__Constructor<T>): T
export function find<T extends Component>(root: Node | Component, path: string, type: __private._types_globals__Constructor<T>): T
export function find(...argv: any[]): any {
    const argc = argv.length;
    switch (argc) {
        case 1: {
            return cc_find(argv[0]);
        }
        case 2: {
            if (typeof argv[0] === 'string') {
                if (argv[1] instanceof Node) return cc_find(argv[0], argv[1]);
                else if (argv[1].node instanceof Node) return cc_find(argv[0], argv[1].node);
                return cc_find(argv[0]).getComponent(argv[1]);
            }

            const root = argv[0] instanceof Node ? argv[0] : (argv[0].node as Node);
            return (typeof argv[1] === 'string') ? cc_find(argv[1], root) : root.getComponent(argv[1]);
        }
        case 3: {
            const root = argv[0] instanceof Node ? argv[0] : (argv[0].node as Node);
            const node = cc_find(argv[1], root);
            if (node) return node.getComponent(argv[2]);
        }
    }
    return null;
}

/**
 * 讀取 Bundle 裡的資源
 */
export async function loadRes<T extends Asset>(bundle: AssetManager.Bundle, url: string): Promise<T> {
    return new Promise<T>(resolve => {
        bundle.load<T>(url, (err, asset) => {
            if (err) { resolve(null); return; }
            resolve(asset);
        });
    });
}
