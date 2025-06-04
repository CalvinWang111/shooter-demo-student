import { _decorator, Component, Prefab } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 遊戲相關資料放在這裡 (例如 Prefab, SpriteFrame, etc)
 */
@ccclass('PropertyRes')
export class PropertyRes extends Component {

    // #region Properties
    @property({ type: Prefab, tooltip: '玩家炮台的 Prefab' })
    queenCannonPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '一般子彈的 Prefab' })
    normalBulletPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '飛斧子彈的 Prefab' })
    axeBulletPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '飛斧子彈軌跡的 Prefab' })
    axeBulletTrackFxPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '飛斧模型的 Prefab' })
    axeModelPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '小金幣的 Prefab' })
    smallCoinPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: 'Boss 金幣的 Prefab' })
    bossCoinPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '獲獎金額數字的 Prefab' })
    winNumPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '未命中文字的 Prefab' })
    missTextPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: 'Boss 來襲的 Prefab' })
    bossComingPrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '水波的 Prefab' })
    waterRipplePrefab: Prefab = null;

    @property({ type: Prefab, tooltip: '水花的 Prefab' })
    waterSplashPrefab: Prefab = null;

    @property({ type: [Prefab], tooltip: '怪物的 Prefab' })
    monsterPrefabs: Prefab[] = [];
    // #endregion

}
