import { Camera, EventMouse, EventTouch, geometry, Mat4, mat4, Node, PhysicsSystem, UITransform, v2, v3, Vec3 } from 'cc';

// 內部變量
const tmp_ray = new geometry.Ray();
const tmp_mat4 = mat4();
const tmp_v3 = v3();
const tmp_v2 = v2();

/**
 * 取得 UI 點擊事件的螢幕點位置
 */
export function getScreenPointByTouch(e: EventTouch | EventMouse, out?: Vec3): Vec3 {
    out = out ?? v3();
    e.getLocation(tmp_v2);    // 拿到的是螢幕點 (左下角為原點)
    return out.set(tmp_v2.x, tmp_v2.y, 0);
}

/**
 * 取得 UI 點擊事件的世界座標
 */
export function getWorldPosByTouch(e: EventTouch | EventMouse, out?: Vec3): Vec3 {
    out = out ?? v3();
    e.getUILocation(tmp_v2);    // 拿到的是 2D 世界座標
    return out.set(tmp_v2.x, tmp_v2.y, 0);
}

/**
 * 將 2D 世界座標點轉換到某個節點的 UI 座標系 (矩陣運算開銷較大請注意呼叫頻率)
 * @param uiDst 轉換到的節點座標系 (必要有 UITransform 元件)
 * @param wpos 世界座標
 * @param out 輸出的座標
 */
export function convertWorldPosToNodeSpace(uiDst: Node | UITransform, wpos: Readonly<Vec3>, out?: Vec3): Vec3 {
    out = out ?? v3();
    // @ts-ignore
    const ui_dst: UITransform = (uiDst.node) ? uiDst : uiDst.getComponent(UITransform);    // UITransform 元件才有 node 屬性
    return ui_dst.convertToNodeSpaceAR(wpos, out);
}

/**
 * 將某個節點的 UI 座標點轉換到 2D 世界座標系 (矩陣運算開銷較大請注意呼叫頻率)
 * @param uiSrc 被轉換的節點 (必要有 UITransform 元件)
 * @param npos 被轉換的節點座標
 * @param out 輸出的座標
 */
export function convertNodePosToWorldSpace(uiSrc: Node | UITransform, npos: Readonly<Vec3>, out?: Vec3): Vec3 {
    out = out ?? v3();
    // @ts-ignore
    const ui_src: UITransform = (uiSrc.node) ? uiSrc : uiSrc.getComponent(UITransform);    // UITransform 元件才有 node 屬性
    return ui_src.convertToWorldSpaceAR(npos, out);
}

/**
 * 將 3D 世界座標轉換到 2D 世界座標系 (不同攝影機之間的轉換)
 * @param cam3D 3D 攝影機
 * @param cam2D 2D 攝影機
 * @param wpos3D 3D 世界座標
 * @param out 輸出的 2D 世界座標
 */
export function convert3DPosTo2DPos(cam3D: Camera, cam2D: Camera, wpos3D: Readonly<Vec3>, out?: Vec3): Vec3 {
    out = out ?? v3();
    const screenPos = cam3D.worldToScreen(wpos3D, tmp_v3);    // 轉換到螢幕座標系
    return cam2D.screenToWorld(screenPos, out);               // 轉換到 2D 世界座標系
}

/**
 * 轉換到某個節點的 UI 座標系 (矩陣運算開銷較大請注意呼叫頻率)
 * @param uiDst 欲轉換到的節點 (必要有 UITransform 元件)
 * @param uiSrc 被轉換的節點 (必要有 UITransform 元件)
 * @param offset 被轉換的節點座標 (預設原點)
 * @param out 輸出的座標
 */
export function transUIPos(uiDst: Node | UITransform, uiSrc: Node | UITransform, offset: Readonly<Vec3> = Vec3.ZERO, out?: Vec3): Vec3 {
    // @ts-ignore
    const ui_src: UITransform = (uiSrc.node) ? uiSrc : uiSrc.getComponent(UITransform);    // UITransform 元件才有 node 屬性
    // @ts-ignore
    const ui_dst: UITransform = (uiDst.node) ? uiDst : uiDst.getComponent(UITransform);    // UITransform 元件才有 node 屬性

    out = out ?? v3();
    const wpos = ui_src.convertToWorldSpaceAR(offset, tmp_v3);
    return ui_dst.convertToNodeSpaceAR(wpos, out);
}

/**
 * 轉換到某個 3D 節點的座標系 (矩陣運算開銷較大請注意呼叫頻率)
 * @param dstNode 欲轉換到的節點
 * @param srcNode 被轉換的節點
 * @param offset 被轉換的節點座標 (預設原點)
 * @param out 輸出的座標
 */
export function trans3DPos(dstNode: Node, srcNode: Node, offset: Readonly<Vec3> = Vec3.ZERO, out?: Vec3): Vec3 {
    const wpos = tmp_v3;
    if (offset === Vec3.ZERO)
        wpos.set(srcNode.worldPosition);
    else
        Vec3.transformMat4(wpos, offset, srcNode.worldMatrix);

    out = out ?? v3();
    const invertedMat4 = Mat4.invert(tmp_mat4, dstNode.worldMatrix);
    return Vec3.transformMat4(out, wpos, invertedMat4);
}

/**
 * 從螢幕發射一條射線, 並取得命中的節點陣列 (需要開啟物理系統)
 * @param cam3D 3D 攝影機
 * @param screenPoint 螢幕點位置
 * @param mask 需要檢測的物理分組 (PhysicsGroup), 檢測全部請填 0xFFFFFFFF
 * @param out 輸出命中的節點陣列
 */
export function raycast(cam3D: Camera, screenPoint: Vec3, mask: number, out: Node[]): boolean {
    // to do
    // 使用 cam3D.screenPointToRay 方法, 帶入 screenPoint 創建一條射線, 並存放到 tmp_ray 中
    // 使用 PhysicsSystem.instance.raycast 方法, 帶入 tmp_ray 和 mask 進行射線檢測
    // 如果檢測到碰撞, 則歷遍 PhysicsSystem.instance.raycastResults 陣列
    // 將每個 result 的 collider.node 存放到 out 陣列中
    console.log(`to do: 請在這裡使用射線檢測的來檢查點擊到的節點`);

    const ray = cam3D.screenPointToRay(screenPoint.x, screenPoint.y, tmp_ray);
    const isHit = PhysicsSystem.instance.raycast(ray, mask);
    if(isHit){
        const result = PhysicsSystem.instance.raycastResults;
        result.forEach(result => {
            const node = result.collider.node;
            out.push(node);
        });
    }

    return isHit;
}

/**
 * 從螢幕發射一條射線, 取得與地面的交點座標
 * @param cam3D 3D 攝影機
 * @param screenPoint 螢幕點位置
 * @param groundHeight 地面高度 (世界座標系)
 * @param out 輸出的交點座標 (世界座標系)
 */
export function raycastToGround(cam3D: Camera, screenPoint: Readonly<Vec3>, groundHeight: number, out: Vec3): boolean {
    const ray = cam3D.screenPointToRay(screenPoint.x, screenPoint.y, tmp_ray);
    const { o, d } = ray;    // o: origin, d: direction

    // 只需要對 Y 分量解方程: o.y + t * d.y = groundHeight
    // 即可求 t 數值 (須注意無解的情況)
    if (d.y !== 0) {
        const t = (groundHeight - o.y) / d.y;
        if (t >= 0) {
            out.set(d).multiplyScalar(t).add(o);
            return true;
        }
    }
    return false;
}
