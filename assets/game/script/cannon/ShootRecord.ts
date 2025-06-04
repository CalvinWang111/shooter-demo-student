/**
 * 射擊記錄結構
 */
export type ShootRecord = {
    bltID: number;         // 子彈編號
    bltBet: number;        // 子彈押注額
    bltCost: number;       // 子彈消耗
    aimingID: number;      // 鎖定的目標
    shootMode: number;     // 射擊模式
    isShot: boolean;       // 是否發射
};

/**
 * 生成新的射擊記錄物件
 */
export function makeShootRecord(): ShootRecord {
    return {
        bltID: 0, bltBet: 0, bltCost: 0,
        aimingID: 0, shootMode: 0,
        isShot: false,
    };
}
