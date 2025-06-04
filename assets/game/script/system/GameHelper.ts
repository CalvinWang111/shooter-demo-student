import { v3 } from 'cc';
import { easeIn, easeOut } from '../utils/Utils';

// Tween: 高頻率使用的參數不重複創建 (減少 GC)
export const TwUtils = {
    props: {
        empty: {},
        opacity_0: { opacity: 0 },
        opacity_255: { opacity: 255 },
        position_0_n100_0: { position: v3(0, -100, 0) },
        angle_0_0_n720: { eulerAngles: v3(0, 0, -720) },
        angle_0_0_360: { eulerAngles: v3(0, 0, 360) }
    },
    opts: {
        easeOut_2: { easing: easeOut(2) },
        easeIn_2: { easing: easeIn(2) }
    }
};

// 專給怪物浮島用的 Tween 參數
// Tween: 高頻率使用的參數不重複創建 (減少 GC)
export const TwFloating = {
    props: {
        positions: [
            { position: v3(0, 8, 0) },
            { position: v3(0, 0, 0) },
            { position: v3(0, -8, 0) },
            { position: v3(0, 0, 0) }
        ],
        angles: [
            { eulerAngles: v3(0, 0, 2) },
            { eulerAngles: v3(0, 0, 4) },
            { eulerAngles: v3(0, 0, -4) },
            { eulerAngles: v3(0, 0, 2) }
        ]
    }
};
