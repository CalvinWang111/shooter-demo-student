import { _decorator, Component, instantiate, math, Node, Prefab, quat, tween, Tween, v3, Vec3 } from 'cc';
import { MeshCustomColor } from '../utils/comp/MeshCustomColor';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { delay } from '../utils/Utils';
import { ShootBetRate } from '../cannon/ShootBetRate';
import { ShootMode } from '../cannon/ShootMode';
import { makeBulletData } from './BulletData';
import { Monster } from '../monster/Monster';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

// 子彈速度設定
const AimSetting = { speed: 900, lifetime: 10 };

// 臨時變量 (計算用)
const tmp_v3_1 = v3();
const tmp_v3_2 = v3();

const { ccclass, property } = _decorator;

@ccclass('AxeBullet')
export class AxeBullet extends Component {

    // #region Properties
    @property({ type: Node, tooltip: '飛斧的移動節點' })
    moveNode: Node = null;

    @property({ type: Node, tooltip: '飛斧的旋轉節點' })
    rotNode: Node = null;

    @property({ type: Node, tooltip: '飛斧的光效節點' })
    lightNode: Node = null;

    @property({ type: Prefab, tooltip: '受擊效果' })
    hitFxPrefab: Prefab = null;
    // #endregion

    private bltData = makeBulletData();
    private hitFxNode = null as Node;                  // 命中特效的引用
    private reuseFunc = null as Function;              // 子彈複用的回調函式

    private axeHandSide = 0;                           // 飛斧使用的順序 (左手或右手)
    private axeInitRot = quat();                       // 飛斧的起始旋轉角度
    private lifetime = 0;
    private speed = 0;

    private isHit = false;
    private isCosted = false;                          // 是否已經扣除花費
    private isFlying = false;                          // 子彈是否在運作中
    private hitTarget = null as Monster;               // 子彈命中的目標 (命中時才有值)
    private aimTarget = null as Monster;               // 使用鎖定模式鎖定的目標
    private aimBulletPos = v3();                       // 模擬鎖定模式子彈的拋物線飛行位置 (移動節點的座標系)
    private targetStartPos = v3();                     // 目標被鎖定時的初始位置 (目標的座標系)
    private targetOffset = v3();                       // 目標被鎖定後的位移量 (目標的座標系)
    private bltStartPos = v3();                        // 子彈的起始位置 (子彈的座標系)
    private hitWpos2D = v3();                          // 命中位置 (2D 世界座標)

    onLoad() {
        this.rotNode.getRotation(this.axeInitRot);
    }

    onDestroy() {
        this.hitFxNode?.destroy();
        this.hitFxNode = null;
        this.reuseFunc = null;
        this.clearBulletAction();
    }

    update(dt: number) {
        if (!this.isUsing())
            return;

        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.onMiss();
            return;
        }

        this.updatePosition(dt);
    }

    /**
     * 初始化子彈相關設定
     * @param wpos3D 子彈的起始位置 (3D 世界座標)
     * @param bltID 子彈的 ID
     * @param bet 子彈的押注額
     * @param cost 子彈的花費
     * @param aimingID 鎖定目標的 ID
     * @param axeHandSide 飛斧使用的順序 (左手或右手)
     * @param reuseFunc 子彈的複用回調
     */
    init(wpos3D: Readonly<Vec3>, bltID: number, bet: number, cost: number, aimingID: number, axeHandSide: number, reuseFunc: Function = null): boolean {
        const { bltData: data } = this;
        data.type = ShootMode.Axe; data.id = bltID;
        data.bet = bet, data.cost = cost;
        data.using = true;

        this.node.setWorldPosition(wpos3D);
        this.reuseFunc = reuseFunc;
        this.isFlying = false;
        this.isCosted = false;
        this.isHit = false;

        // 飛斧一定是鎖定目標的
        const entity = Game.monsterMgr.getEntityByID(aimingID);
        if (!entity || !entity.isUsing()) {
            this.destroyBullet();
            return false;
        }

        this.axeHandSide = axeHandSide;
        this.aimTarget = entity;
        this.setup();

        this.isFlying = true;    // 子彈開始飛行
        this.isCosted = true;    // 沒命中時需要退幣
        return true;
    }

    private setup() {
        this.speed = AimSetting.speed;
        this.lifetime = AimSetting.lifetime;
        this.bltStartPos.set(this.node.position);
        this.targetStartPos.set(this.aimTarget.node.position);
        this.targetOffset.set(0, 0, 0);
        this.moveNode.setPosition(0, 0, 0);
        this.lightNode.active = true;
        this.setAiming();
        this.setTrackFx();
    }

    /**
     * 鎖定子彈相關的設定
     */
    private setAiming() {
        // 設定飛斧是左傾或右傾
        const myNode = this.node;
        const axeHandSide = this.axeHandSide;
        const hitOffset = (axeHandSide === 0) ? -30 : 30;                                    // 左右落點分開點
        const rotZ = math.randomRange(25, 35) * ((axeHandSide === 0) ? 1 : -1);
        myNode.setRotationFromEuler(0, 0, rotZ);

        const moveNode = this.moveNode;
        const movePosition = moveNode.position;
        const aimWpos3D = Game.shootingMgr.getAimingWorldPos(this.aimTarget, tmp_v3_2);
        const targetPos = moveNode.parent.inverseTransformPoint(tmp_v3_1, aimWpos3D);        // 計算用的臨時變量
        const diffPos = tmp_v3_2.set(targetPos).subtract(movePosition);                      // 計算用的臨時變量
        diffPos.x += hitOffset;
        diffPos.y = 0;

        const distance = diffPos.length();
        const flyTime = Math.max(.5, distance / this.speed);
        const flyHalfTime = flyTime / 2;
        const flyOffsetY = Math.min(350, Math.max(distance / 4, targetPos.y + 25));          // 高度位移量
        const maxHeight = movePosition.y + flyOffsetY;                                       // 拋物線的最高點
        const endHeight = targetPos.y;                                                       // 拋物線的結束高度

        // 飛斧移動和一般子彈不同, 移動的是子節點, 而不是子彈本身
        const movingPos = moveNode.getPosition(this.aimBulletPos);
        tween(movingPos)
            .to(flyHalfTime, { y: maxHeight }, TwUtils.opts.easeOut_2)
            .to(flyHalfTime, { y: endHeight }, TwUtils.opts.easeIn_2)
            .start();

        tween(movingPos)
            .by(flyTime, { x: diffPos.x, z: diffPos.z })
            .call(() => {
                const entity = this.aimTarget;
                if (!entity || !entity.isUsing()) {    // 確認命中的目標有效
                    this.onMiss();
                    return;
                }
                this.hitTarget = entity;
                this.onHit();
            })
            .start();

        // 飛斧旋轉
        this.rotNode.setRotation(this.axeInitRot);
        tween(this.rotNode)
            .by(flyTime, TwUtils.props.angle_0_0_n720)
            .repeatForever()
            .start();
    }

    /**
     * 拖尾特效設定
     */
    private setTrackFx() {
        // to do
        // 請用 Tween 寫一個每 0.1 秒重複執行 (repeatForever) 的 Timer 掛載在 this.rotNode 上
        // 並每 0.1 秒生成一個 track 節點, 按當前飛斧的位置和旋轉角度放置到場景上
        // 1. track 節點使用 Game.dataMgr.getAxeBulletTrackFxNode() 取得
        // 2. track 節點的父節點設為 Game.node.effect3DLayer (這是場景中的一個節點, 用來放特效的)
        // 3. track 節點的世界座標設為 this.moveNode.worldPosition (飛斧的移動節點)
        // 4. track 節點的世界旋轉設為 this.node.worldRotation (飛斧的旋轉節點)
        // 5. 播放 track 節點的動畫, 使用 playAnime(track, '', null, () => { ... }) 播放動畫
        // 6. 動畫播放完畢後, 將 track 節點放回到物件池中, 使用 Game.dataMgr.putToAxeBulletTrackFxPool(track)

        tween(this.rotNode).delay(.1).call(() => {
            const node = Game.dataMgr.getAxeBulletTrackFxNode();
            node.setParent(Game.node.effect3DLayer);
            node.setWorldPosition(this.moveNode.worldPosition);
            node.setRotation(this.node.worldRotation);
            playAnime(node, '', null, () => {
                Game.dataMgr.putToAxeBulletTrackFxPool(node);
            });
        })
        .union().repeatForever()
        .start();
        console.log(`to do: 請在這裡實作拖尾特效的功能`);
    }

    /**
     * 命中目標的處理 (呼叫前請確保命中目標有效) q
     */
    private onHit() {
        this.isHit = true;
        this.updateHitWpos2D();
        this.makeFakeAxeOnHit();

        // 通知系統子彈命中目標
        const hits = Math.floor(ShootBetRate.Axe);
        this.hitTarget.showHurt(hits);
        Game.monsterMgr.entityOnHit(this.hitTarget, this.bltData);

        // 先隱藏子彈, 等待命中特效播放完畢後再銷毀
        this.playHitFx(() => this.destroyBullet());
        this.node.setPosition(0, -1e6, 0);
        this.clearBulletAction();
    }

    /**
     * 未命中目標的處理
     */
    private onMiss() {
        this.isHit = false;
        this.updateHitWpos2D();

        // 未命中的子彈, 要做退幣處理
        if (this.isCosted) {
            const { bltData: data } = this;
            Game.effectMgr.showMissText(this.hitWpos2D);
            Game.shootingMgr.cancelShoot(data.type, data.id, data.bet, data.cost);
            this.isCosted = false;
        }

        // 先隱藏子彈, 等待命中特效播放完畢後再銷毀
        this.playHitFx(() => this.destroyBullet());
        this.node.setPosition(0, -1e6, 0);
        this.clearBulletAction();
    }

    /**
     * 更新命中位置 (2D 世界座標)
     */
    private updateHitWpos2D() {
        convert3DPosTo2DPos(
            Game.cam3D, Game.cam2D,
            this.moveNode.worldPosition, this.hitWpos2D
        );
    }

    /**
     * 播放命中特效 (在子彈當前位置播放)
     */
    private playHitFx(endFunc: Function) {
        const hitFx = this.hitFxNode ?? instantiate(this.hitFxPrefab);
        hitFx.setParent(Game.node.effect2DLayer);
        this.hitFxNode = hitFx;

        hitFx.setWorldPosition(this.hitWpos2D);
        hitFx.angle = this.node.eulerAngles.z;

        playAnime(hitFx, '', null, () => {
            this.hitFxNode.removeFromParent();
            endFunc();
        });
    }

    /**
     * 命中時生成一個假飛斧黏在目標身上
     */
    private makeFakeAxeOnHit() {
        const { hitTarget } = this;
        if (!hitTarget || !hitTarget.isUsing())
            return;

        const { node: myNode, rotNode } = this;
        const fakeAxe = Game.dataMgr.getAxeModelNode();
        const color = fakeAxe.getComponent(MeshCustomColor);
        fakeAxe.setParent(hitTarget.node);
        fakeAxe.setWorldPosition(rotNode.worldPosition);
        fakeAxe.setWorldRotation(myNode.worldRotation);

        delay(fakeAxe, .55, () => {
            tween(color)
                .to(.25, TwUtils.props.opacity_0, TwUtils.opts.easeIn_2)
                .call(() => {
                    color.opacity = 255;
                    Tween.stopAllByTarget(color);
                    Game.dataMgr.putToAxeModelPool(fakeAxe);
                })
                .start();
        });
    }

    /**
     * 清除子彈動作
     */
    private clearBulletAction() {
        if (this.isFlying) {
            Tween.stopAllByTarget(this.rotNode);
            Tween.stopAllByTarget(this.aimBulletPos);
            this.moveNode.setPosition(0, 0, 0);
            this.aimTarget = null;
            this.hitTarget = null;
            this.isFlying = false;
            this.lifetime = 0;
            this.setUsing(false);
        }
    }

    /**
     * 銷毀子彈 (或回收子彈到節點池)
     */
    private destroyBullet() {
        this.clearBulletAction();
        if (!this.reuseFunc) {
            this.node.destroy();
            return;
        }

        this.reuseFunc();
        this.reuseFunc = null;
    }

    private updatePosition(dt: number) {
        // 鎖定子彈跟隨模擬的座標點, 要加上怪物位移量 & 計算角度
        const target = this.aimTarget;
        if (target && target.isUsing()) {
            const targetPos = target.node.position;
            this.targetOffset.set(targetPos).subtract(this.targetStartPos);
            this.targetOffset.add3f(0, 30, 70);    // 避免飛斧模型跑到目標身體裡面
        }

        const bltPos = tmp_v3_2.set(this.bltStartPos).add(this.targetOffset);
        this.moveNode.setPosition(this.aimBulletPos);
        this.node.setPosition(bltPos);
    }

    setUsing(toggle: boolean) {
        this.bltData.using = toggle;
    }

    isUsing(): boolean {
        return this.bltData.using;
    }

    /**
     * 子彈資訊
     */
    get data() {
        return this.bltData;
    }

}
