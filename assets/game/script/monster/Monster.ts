import { _decorator, Animation, BoxCollider, CCInteger, Component, Node, Quat, renderer, tween, Tween, v3, Vec3 } from 'cc';
import { MeshCustomColor } from '../utils/comp/MeshCustomColor';
import { getMoveTween } from '../motion/PathData';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('Monster')
export class Monster extends Component {

    // #region Properties
    @property([CCInteger])
    oddsList: number[] = [];

    @property([Animation])
    monsterAnims: Animation[] = [];                             // 怪物的動畫

    @property([Node])
    aimNodes: Node[] = [];                                      // 鎖定位置的節點 (用來確定鎖定圖示的位置)

    @property([BoxCollider])
    colliders: BoxCollider[] = [];                              // 碰撞器

    @property({ tooltip: '是否為一般怪物' })
    isNormalMonster: boolean = false;

    @property({ tooltip: '是否為特殊怪物' })
    isSpecialMonster: boolean = false;

    @property({ tooltip: '是否為 Boss 怪物' })
    isBossMonster: boolean = false;
    // #endregion    

    protected meshCustomColor = null as MeshCustomColor;        // 自訂顏色的元件
    protected damagetween = null as Tween<MeshCustomColor>;     // 受擊擊的閃爍動畫
    protected tintBase = 0;                                     // Bleach 的基準值 (預設為 0)

    protected no = 0;                                           // 怪物的編號 (哪種怪物)
    protected id = 0;                                           // 怪物的流水號 (場景中的編號)
    protected oddsIndex = 0;                                    // 賠率的索引 (目前的賠率)

    protected using = false;                                    // 是否使用中
    protected defaultScale = v3(1, 1, 1);                       // 怪物的原始縮放

    protected moveTween = null as Tween<Node>;                  // 路徑移動的 Tween
    protected moveEnd = false;                                  // 是否已結束移動
    protected reuse = true;                                     // 是否可以重複使用

    onLoad() {
        this.meshCustomColor = this.node.getComponent(MeshCustomColor);
        this.defaultScale.set(this.node.scale);
    }

    onDestroy() {
        Tween.stopAllByTarget(this.node);
        this.stopDamageTint();
        this.stopMove();
    }

    /**
     * 初始化
     */
    init(no: number, id: number) {
        this.no = no;                               // 怪物的編號 (哪種怪物)
        this.id = id;                               // 怪物的流水號 (場景中的編號)
        this.colliders.forEach(c => {               // 啟用碰撞器
            c.enabled = true;
        });

        // 設置狀態
        this.using = true;                          // 使用中
        this.reuse = true;                          // 是否可以重複使用
        this.moveEnd = false;                       // 準備移動中

        // 節點設定
        const node = this.node;
        node.setScale(this.defaultScale);
        node.setRotation(Quat.IDENTITY);
        node.setPosition(0, -5000, 0);
    }

    /**
     * 設置路徑移動 (路徑結束時自動呼叫 pushToPool 函式)
     */
    setMovePath(pathNo: number): boolean {
        if (this.moveTween)
            this.stopMove();

        const moveTween = getMoveTween(pathNo, this.node);
        if (!moveTween) {
            this.moveEnd = true;
            return false;
        }

        this.moveEnd = false;
        this.moveTween = moveTween
            .call(() => {
                this.scheduleOnce(() => this.pushToPool());    // 延遲一幀, 可避免大多數的時序問題
                this.moveTween = null;
                this.moveEnd = true;
            })
            .start();

        return true;
    }

    /**
     * 停止路徑移動
     */
    stopMove() {
        this.moveTween?.stop();
        this.moveTween = null;
        this.moveEnd = true;
    }

    /**
     * 回收到自己的 Pool 中
     */
    pushToPool() {
        Tween.stopAllByTarget(this.node);
        this.damageTint(false);
        this.setGrayScale(0);
        this.stopMove();

        this.using = false;
        this.node.setScale(this.defaultScale);
        Game.monsterMgr.removeFromEntitiesMap(this.id);

        if (!this.reuse) {
            this.node.destroy();
            return;
        }
        Game.dataMgr.putToMonsterPool(this.node, this.no);
    }

    /**
     * 設定怪物的灰度值
     */
    setGrayScale(value: number) {
        // to do
        // 設定這隻怪物的灰度值 (0 ~ 1), 0 為正常顏色, 1 為全灰色
        // 1. 使用這隻怪物的 MeshCustomColor 元件 (this.meshCustomColor)
        // 2. 如果沒有這個元件, 則不做任何事
        // 3. 設定 grayScale 的值為 value
        console.log(`to do: 請在這裡設定怪物的灰度值`);
        this.meshCustomColor.grayScale = value;
    }

    /**
     * 受擊閃爍效果
     */
    damageTint(toggle: boolean, dur: number = .25) {
        const color = this.meshCustomColor;
        if (!color) return;

        if (!toggle) {
            color.bleach = this.tintBase;
            this.stopDamageTint();
        }
        else if (toggle && !this.damagetween) {
            const bleachMaxVal = .67;
            color.bleach = this.tintBase;

            this.damagetween = tween(color)
            .to(dur, {bleach: bleachMaxVal},{easing: TwUtils.opts.easeOut_2.easing})
            .call(()=>{
                color.bleach = this.tintBase;
                this.damagetween = null;
            }).start();
            


            // to do
            // 播放受擊閃爍
            // 1. 使用 tween 對 color 播放一個閃爍的動畫, this.damagetween = tween(color)...
            // 2. 持續時間為 dur 秒, 目標值為 bleachMaxVal, easing function 使用 TwUtils.opts.easeOut_2
            // 3. 播放結束後, 將 color.bleach 設回 this.tintBase, 並將 this.damagetween 設為 null
            console.log(`to do: 請在這裡實作受擊閃爍的功能`);
        }
    }

    /**
     * 停止受擊閃爍緩動
     */
    protected stopDamageTint() {
        this.damagetween?.stop();
        this.damagetween = null;
    }

    /**
     * 取得這隻怪物的原始縮放
     */
    getDefaultScale(): Readonly<Vec3> {
        return this.defaultScale;
    }

    /**
     * 取得這隻怪物的賠率 (目前使用的賠率)
     */
    getOdds(): number {
        return this.oddsList[this.oddsIndex];
    }

    /**
     * 取得怪物的編號 (哪種怪物)
     */
    getNo(): number {
        return this.no;
    }

    /**
     * 怪物的流水號 (場景中的編號)
     */
    getID(): number {
        return this.id;
    }

    /**
     * 是否移動結束
     */
    isMoveEnd(): boolean {
        return this.moveEnd;
    }

    /**
     * 設定是否使用中
     */
    setUsing(toggle: boolean) {
        this.using = toggle;
    }

    /**
     * 是否使用中
     */
    isUsing(): boolean {
        return this.using;
    }

    /**
     * 設定是否可複用
     */
    setReuse(toggle: boolean) {
        this.reuse = toggle;
    }

    /**
     * 是否可複用
     */
    isReuse(): boolean {
        return this.reuse;
    }

    // ----------------------------------------------------------------
    // 這裡是一些預設的函式, 由子類實作
    // ----------------------------------------------------------------

    /**
     * 在初始化完之後, 如果有還有特殊需求可以在這裡實作
     */
    postInit() { /* 由子類實作 */ }

    /**
     * 表演受擊
     * @param hits 擊中次數
     */
    showHurt(hits: number) { /* 由子類實作 */ }

    /**
     * 表演得獎
     * @param winNum 贏的金額
     * @returns 是否已處理過金流?
     */
    showReward(winNum: number): boolean { return false; /* 由子類實作 */ }

    /**
     * 表演死亡
     */
    showDeath() { /* 由子類實作 */ }

    /**
     * 取得受擊音效名稱
     */
    getHurtSndName(): string { return ''; /* 由子類實作 */ }

}
