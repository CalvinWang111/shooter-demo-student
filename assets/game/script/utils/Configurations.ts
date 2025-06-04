import { sys } from 'cc';
import { DEBUG, PREVIEW } from 'cc/env';

/**
 * 通用的配置設置
 */
export const Config = {
    /**
     * 畫面適配相關
     */
    screen: {
        /**
         * 畫面縮放比例 (場景大小和實際遊戲設計解析度的落差)
         */
        scale: 1,
        /**
         * 畫面最大長邊比
         */
        maxLongSideRate: 21 / 9,
        /**
         * 畫面最大短邊比
         */
        maxShortSideRate: 9 / 16,
    }
};

/**
 * 運行環境相關
 */
export const Env = {
    /**
     * 是否為開發測試環境
     */
    isDevTest: false
};

//進入主包後, 初始化相關設置
(function () {
    if (sys.isBrowser === false) {
        Env.isDevTest = false;
        return;
    }

    const myUrl = window.location.href;
    const isMyBuild = myUrl.includes('web-mobile');
    const isGitHubDemo = myUrl.includes('github.io');
    Env.isDevTest = (PREVIEW || DEBUG || isMyBuild || isGitHubDemo);
})();
