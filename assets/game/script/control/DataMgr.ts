import { _decorator, Component, director, instantiate, Node, NodePool } from 'cc';
import { PropertyRes } from './PropertyRes';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('DataMgr')
export class DataMgr extends Component {

    private _res = null as PropertyRes;

    /**
     * 遊戲相關資源
     */
    get res(): PropertyRes {
        return this._res;
    }

    onLoad() {
        Game.dataMgr = this;
        this.freeOnStageDestroy(() => Game.dataMgr = null);
        this._res = this.getComponentInChildren(PropertyRes);
    }

    onDestroy() {
        this.clearAllPools();
    }

    /**
     * 註冊釋放函式, 會在 Stage 被銷毀時的最後一步執行
     */
    freeOnStageDestroy(endFunc: () => void) {
        director.once('__Free__', endFunc);
    }

    /**
     * 釋放所有的 Pool
     */
    private clearAllPools() {
        this.normalBltPool.clear();
        this.axeBltPool.clear();
        this.axeBltTrackFxPool.clear();
        this.axeModelPool.clear();

        this.smallCoinPool.clear();
        this.bossCoinPool.clear();
        this.winNumPool.clear();
        this.missTextPool.clear();

        this.waterRipplePool.clear();
        this.waterSplashPool.clear();

        this.monsterPoolMap.forEach(pool => pool.clear());
        this.monsterPoolMap.clear();
    }

    // ----------------------------------------------------------------
    // Cannon 相關
    // ----------------------------------------------------------------

    // #region RoleCannon
    getQueenCannonNode(): Node {
        return instantiate(this._res.queenCannonPrefab);
    }
    // #endregion

    // ----------------------------------------------------------------
    // Bullet 相關
    // ----------------------------------------------------------------

    // #region Bullet
    private normalBltPool = new NodePool();

    getNormalBulletNode(): Node {
        return this.normalBltPool.get() ?? instantiate(this._res.normalBulletPrefab);
    }

    putToNormalBulletPool(node: Node) {
        this.normalBltPool.put(node);
    }

    private axeBltPool = new NodePool();

    getAxeBulletNode(): Node {
        return this.axeBltPool.get() ?? instantiate(this._res.axeBulletPrefab);
    }

    putToAxeBulletPool(node: Node) {
        this.axeBltPool.put(node);
    }

    private axeBltTrackFxPool = new NodePool();

    getAxeBulletTrackFxNode(): Node {
        return this.axeBltTrackFxPool.get() ?? instantiate(this._res.axeBulletTrackFxPrefab);
    }

    putToAxeBulletTrackFxPool(node: Node) {
        this.axeBltTrackFxPool.put(node);
    }

    private axeModelPool = new NodePool();

    getAxeModelNode(): Node {
        return this.axeModelPool.get() ?? instantiate(this._res.axeModelPrefab);
    }

    putToAxeModelPool(node: Node) {
        this.axeModelPool.put(node);
    }
    // #endregion

    // ----------------------------------------------------------------
    // Coin 相關
    // ----------------------------------------------------------------

    // #region Coin
    private smallCoinPool = new NodePool();

    getSmallCoinNode(): Node {
        return this.smallCoinPool.get() ?? instantiate(this._res.smallCoinPrefab);
    }

    putToSmallCoinPool(node: Node) {
        this.smallCoinPool.put(node);
    }

    private bossCoinPool = new NodePool();

    getBossCoinNode(): Node {
        return this.bossCoinPool.get() ?? instantiate(this._res.bossCoinPrefab);
    }

    putToBossCoinPool(node: Node) {
        this.bossCoinPool.put(node);
    }

    private winNumPool = new NodePool();

    getWinNumNode(): Node {
        return this.winNumPool.get() ?? instantiate(this._res.winNumPrefab);
    }

    putToWinNumPool(node: Node) {
        this.winNumPool.put(node);
    }

    private missTextPool = new NodePool();

    getMissTextNode(): Node {
        return this.missTextPool.get() ?? instantiate(this._res.missTextPrefab);
    }

    putToMissTextPool(node: Node) {
        this.missTextPool.put(node);
    }
    // #endregion

    // ----------------------------------------------------------------
    // WaterFx 相關
    // ----------------------------------------------------------------

    // #region WaterFx
    private waterRipplePool = new NodePool();

    getWaterRippleNode(): Node {
        return this.waterRipplePool.get() ?? instantiate(this._res.waterRipplePrefab);
    }

    putToWaterRipplePool(node: Node) {
        this.waterRipplePool.put(node);
    }

    private waterSplashPool = new NodePool();

    getWaterSplashNode(): Node {
        return this.waterSplashPool.get() ?? instantiate(this._res.waterSplashPrefab);
    }

    putToWaterSplashPool(node: Node) {
        this.waterSplashPool.put(node);
    }
    // #endregion

    // ----------------------------------------------------------------
    // Monster 相關
    // ----------------------------------------------------------------

    // #region Monster
    private monsterPoolMap = new Map<number, NodePool>();

    getMonsterNode(no: number): Node | null {
        const monsterPrefabs = this._res.monsterPrefabs;
        if (no <= 0 || no >= monsterPrefabs.length)
            return null;

        const poolMap = this.monsterPoolMap;
        let pool = poolMap.get(no);
        if (!pool) {
            pool = new NodePool();
            poolMap.set(no, pool);
        }
        return pool.get() ?? instantiate(monsterPrefabs[no]);
    }

    putToMonsterPool(node: Node, no: number) {
        const poolMap = this.monsterPoolMap;
        let pool = poolMap.get(no);
        if (!pool) {
            node.destroy();
            return;
        }
        pool.put(node);
    }
    // #endregion

}
