import { _decorator, Component, lerp, math, Node, tween, Tween, v3, Vec3 } from 'cc';

const { ccclass } = _decorator;

@ccclass('Shake2D')
export class Shake2D extends Component {
    shakingTween: Tween<Node> = null;
    endTween: Tween<Node> = null;
    oldPos: Vec3 = null;
}

// 內部變量
const empty_props = {};
const directions = new Array<Vec3>(36);

// 初始化內部變量
(function () {
    const TWO_PI = Math.PI * 2;
    for (let i = 0, len = directions.length; i < len; ++i) {
        const rad = TWO_PI * (i / len);
        const dir = Vec3.rotateZ(v3(), Vec3.UP, Vec3.ZERO, rad);
        directions[i] = dir;
    }
})();

/**
 * 晃動效果
 * @param node 要晃動的節點
 * @param dur 持續時間
 * @param freq 晃動頻率
 * @param strength 晃動強度
 * @param damping 阻尼 (0 ~ 1)
 */
export function shake2D(node: Node, dur: number, freq: number, strength: number, damping: number = 1) {
    if (!node.activeInHierarchy)
        return;

    // 是否重複呼叫
    let comp = node.getComponent(Shake2D);
    if (comp) clearShake2DComp(node, comp);

    // 晃動資訊
    dur = Math.max(0, dur);
    freq = Math.floor(Math.max(1, freq));
    const dir = directions[math.randomRangeInt(0, directions.length)];
    const pos = v3(node.position);
    const p1 = v3(pos), p2 = v3(dir).multiplyScalar(strength).add(pos);
    const dt = 1 / freq;

    // 晃動緩動計算
    let lastQ = 0, scalar = strength;
    const shakingTween = tween(node).by(dur, empty_props, {
        onUpdate: (_, t: number) => {
            const P = (dur * t) / dt;   // 滑窗位置
            const Q = Math.floor(P);    // 商數
            if (Q > lastQ) {
                const dir = directions[math.randomRangeInt(0, directions.length)];
                lastQ = Q; scalar *= damping;
                p1.set(p2); p2.set(dir).multiplyScalar(scalar).add(pos);
            }

            const R = P - Q;            // 餘數
            node.setPosition(
                lerp(p1.x, p2.x, R),
                lerp(p1.y, p2.y, R)
            );
        }
    });
    const endTween = tween(node).delay(dur)
        .call(() => shake2DStop(node))

    // 執行晃動
    comp = comp ?? node.addComponent(Shake2D);
    comp.shakingTween = shakingTween.start();
    comp.endTween = endTween.start();
    comp.oldPos = pos;
}

/**
 * 停止晃動效果
 * @param node 要停止晃動的節點
 */
export function shake2DStop(node: Node) {
    if (!node || !node.isValid)
        return;

    const comp = node.getComponent(Shake2D);
    if (comp) {
        clearShake2DComp(node, comp);
        comp.destroy();
    }
}

/**
 * 清除晃動效果
 */
function clearShake2DComp(node: Node, comp: Shake2D) {
    comp.shakingTween?.stop();
    comp.endTween?.stop();
    if (comp.oldPos) {
        const pos = comp.oldPos;
        node.setPosition(pos.x, pos.y);
    }
    comp.shakingTween = null;
    comp.endTween = null;
    comp.oldPos = null;
}
