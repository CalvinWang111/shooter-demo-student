import { ShootMode } from './ShootMode';

/**
 * 各類子彈的押注額倍率 (子彈花費 = 押注額 * 子彈押注額倍率)
 */
export const ShootBetRate = {
    Normal: 1,        // 普通子彈
    Normal_Aim: 1,    // 普通子彈 (瞄準)
    Axe: 5,           // 飛斧
}

/**
 * 取得各類子彈實際上表示多少次 Hits
 * (由於和 ShootBetRate 有關聯, 所以寫在這裡)
 */
export function getHitsByShootMode(mode: number): number {
    if (mode === ShootMode.Normal) return 1;
    if (mode === ShootMode.Normal_Aim) return 1;
    if (mode === ShootMode.Axe) return 5;
    return 1;
}
