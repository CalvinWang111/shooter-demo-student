/**
 * 子彈的通用資料
 */
export type BulletData = {
    type: number;
    id: number;
    bet: number;
    cost: number;
    using: boolean;
};

/**
 * 用來存放子彈的通用資料
 */
export function makeBulletData(): BulletData {
    return {
        /**
         * 子彈的類型
         */
        type: 0,
        /**
         * 子彈的流水號
         */
        id: 0,
        /**
         * 子彈的押注額
         */
        bet: 0,
        /**
         * 子彈的成本 (子彈花費 = 押注額 * 子彈押注額倍率)
         */
        cost: 0,
        /**
         * 子彈是否使用中
         */
        using: false
    };
}
