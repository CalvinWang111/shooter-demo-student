import { Node, tween, Tween, v3, Vec3 } from 'cc';

function addDelay(move: Tween<Node>, dur: number): Tween<Node> {
    return move.delay(dur);
}

function addPosSet(move: Tween<Node>, pos: Readonly<Vec3>): Tween<Node> {
    return move.set({ position: v3(pos) });
}

function addLineTo(move: Tween<Node>, dur: number, pos: Readonly<Vec3>): Tween<Node> {
    return move.to(dur, { position: v3(pos) });
}

const movePathMap = new Map<number, Tween<Node>>();

/**
 * 取得路徑移動的 Tween
 */
export function getMoveTween(pathNo: number, target: Node): Tween<Node> | null {
    const move = movePathMap.get(pathNo);
    if (move) return move.clone(target);
    return null;
}

// ----------------------------------------------------------------
// 單機 Demo 沒有路徑編輯器, 所以這裡用 Tween 簡單做個路徑移動功能
// ----------------------------------------------------------------

const path_1 = tween();
addDelay(path_1, 0);
addPosSet(path_1, v3(810, 0, -280));
addLineTo(path_1, 20, v3(-810, 0, -280));
movePathMap.set(1, path_1);

const path_2 = tween();
addDelay(path_2, 0);
addPosSet(path_2, v3(-810, 0, 150));
addLineTo(path_2, 20, v3(810, 0, 150));
movePathMap.set(2, path_2);

const path_3 = tween();
addDelay(path_3, 0);
addPosSet(path_3, v3(-810, 0, -320));
addLineTo(path_3, 6, v3(-300, 0, -320));
addLineTo(path_3, 5, v3(-300, 0, 280));
addLineTo(path_3, 6, v3(-810, 0, 280));
movePathMap.set(3, path_3);

const path_4 = tween();
addDelay(path_4, 0);
addPosSet(path_4, v3(810, 0, -320));
addLineTo(path_4, 6, v3(300, 0, -320));
addLineTo(path_4, 5, v3(300, 0, 280));
addLineTo(path_4, 6, v3(810, 0, 280));
movePathMap.set(4, path_4);

const path_5 = tween();
addDelay(path_5, 0);
addPosSet(path_5, v3(-810, 0, 160));
addLineTo(path_5, 4, v3(-480, 0, 160));
addLineTo(path_5, 3, v3(-480, 0, -180));
addLineTo(path_5, 4, v3(-810, 0, -180));
movePathMap.set(5, path_5);

const path_6 = tween();
addDelay(path_6, 0);
addPosSet(path_6, v3(810, 0, 160));
addLineTo(path_6, 4, v3(480, 0, 160));
addLineTo(path_6, 3, v3(480, 0, -180));
addLineTo(path_6, 4, v3(810, 0, -180));
movePathMap.set(6, path_6);

const path_101 = tween();
addDelay(path_101, 0);
addPosSet(path_101, v3(0, 0, -120));
addLineTo(path_101, 65, v3(0, 0, -120));    // Boss 預計在場上 60 秒, 多 5 秒當離場動畫的緩衝
movePathMap.set(101, path_101);
