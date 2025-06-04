import { _decorator, BoxCollider, Component, ICollisionEvent, instantiate, math, Node, physics, Prefab, quat, Quat, tween, Tween, v3, Vec3 } from 'cc';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { ShootBetRate } from '../cannon/ShootBetRate';
import { ShootMode } from '../cannon/ShootMode';
import { makeBulletData } from './BulletData';
import { Monster } from '../monster/Monster';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

// 子彈速度設定
const NormalSetting = { speed: 1100, lifetime: 10 };
const AimSetting = { speed: 800, lifetime: 10 };

// 臨時變量 (計算用)
const tmp_v3_1 = v3(), tmp_v3_2 = v3();
const tmp_quat = quat();

const { ccclass, property } = _decorator;

@ccclass('NormalBullet')
export class NormalBullet extends Component {

    // #region Properties
    @property({ type: Node, tooltip: '子彈的旋轉節點' })
    rotNode: Node = null;

    @property({ type: Prefab, tooltip: '受擊效果' })
    hitFxPrefab: Prefab = null;
    // #endregion

    private bltData = makeBulletData();
    private collider = null as BoxCollider;
    private hitFxNode = null as Node;                  // 命中特效的引用
    private reuseFunc = null as Function;              // 子彈複用的回調函式

    private lifetime = 0;
    private speed = 0;
    private dir = v3();
    private vel = v3();

    private isHit = false;
    private isAiming = false;
    private isCosted = false;                          // 是否已經扣除花費
    private isFlying = false;                          // 子彈是否在運作中
    private hitTarget = null as Monster;               // 子彈命中的目標 (命中時才有值)
    private aimTarget = null as Monster;               // 使用鎖定模式鎖定的目標
    private aimBulletPos = v3();                       // 模擬鎖定模式子彈的拋物線飛行位置 (移動節點的座標系)
    private targetStartPos = v3();                     // 目標被鎖定時的初始位置 (目標的座標系)
    private targetOffset = v3();                       // 目標被鎖定後的位移量 (目標的座標系)
    private hitWpos2D = v3();                          // 命中位置 (2D 世界座標)

    onLoad() {
        // to do
        // 抓取該節點的 BoxCollider 元件, 存放到 this.collider 變量中
        // 在 this.collider 上註冊 'onTriggerEnter' 事件, 設定 this.onTriggerEnter 為回調函式
        this.collider = this.getComponent(BoxCollider);
        this.collider.on("onTriggerEnter", this.onTriggerEnter, this);
        console.log(`to do: 請在這裡抓取 BoxCollider 元件並註冊 'onTriggerEnter' 事件`);
    }

    onDestroy() {
        // to do
        // 銷毀時, 取消註冊 'onTriggerEnter' 事件
        console.log(`to do: 請在這裡取消註冊 'onTriggerEnter' 事件`);
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
     * @param reuseFunc 子彈的複用回調
     */
    init(wpos3D: Readonly<Vec3>, bltID: number, bet: number, cost: number, aimingID: number, reuseFunc: Function = null): boolean {
        const { bltData: data } = this;
        data.type = ShootMode.Normal; data.id = bltID;
        data.bet = bet, data.cost = cost;
        data.using = true;

        this.node.setWorldPosition(wpos3D);
        this.reuseFunc = reuseFunc;
        this.isAiming = false;
        this.isFlying = false;
        this.isCosted = false;
        this.isHit = false;

        // 有 aimingID 代表是鎖定模式
        if (aimingID !== -1) {
            const entity = Game.monsterMgr.getEntityByID(aimingID);
            if (!entity || !entity.isUsing()) {
                this.destroyBullet();
                return false;
            }
            data.type = ShootMode.Normal_Aim;
            this.aimTarget = entity;
            this.isAiming = true;
        }
        this.setup();

        this.isFlying = true;    // 子彈開始飛行
        this.isCosted = true;    // 沒命中時需要退幣
        return true;
    }

    private setup() {
        if (this.isAiming) {
            this.speed = AimSetting.speed;
            this.lifetime = AimSetting.lifetime;
            this.targetStartPos.set(this.aimTarget.node.position);
            this.targetOffset.set(0, 0, 0);
            this.setAiming();
        }
        else {
            this.speed = NormalSetting.speed;
            this.lifetime = AimSetting.lifetime;
            this.dir.set(0, 0, -1);
            this.vel.set(this.dir).multiplyScalar(this.speed);
        }

        // 對齊朝向
        this.alignDirection();

        // 子彈自旋
        tween(this.rotNode)
            .by(.6, TwUtils.props.angle_0_0_360)
            .repeatForever()
            .start();
    }

    /**
     * 鎖定子彈相關的設定
     */
    private setAiming() {
        const myNode = this.node;
        const myPosition = myNode.position;
        const aimWpos3D = Game.shootingMgr.getAimingWorldPos(this.aimTarget, tmp_v3_2);
        const targetPos = myNode.parent.inverseTransformPoint(tmp_v3_1, aimWpos3D);          // 計算用的臨時變量
        const diffPos = tmp_v3_2.set(targetPos).subtract(myPosition);                        // 計算用的臨時變量
        diffPos.y = 0;

        // to do
        // 請實作子彈的拋物線飛行 (使用 tween 動畫)
        // 原理: 將子彈飛行拆成 XZ 平面和 Y 軸兩個部分
        // 1. XZ 平面移動直接走直線過去
        // 2. Y 軸移動拆成上升和下降兩段, 並使用 easeOut 和 easeIn 方式, 模擬加減速的效果
        // 3. 對 this.aimBulletPos 執行上述 tween 動畫
        // 4. 每幀更新子彈節點位置到 this.aimBulletPos 的位置上

        // 已知條件: 目標位置 targetPos, 子彈起始位置 myPosition
        // 已知條件: 子彈到目標的向量 diffPos, 子彈速度 this.speed
        // 1. 先求出 diffPos 的 XZ 距離
        // 2. 計算飛行時間 (不小於 0.5 秒), 距離 / 速度 = 時間
        // 3. 計算飛行的高度位移量 (flyOffsetY), 使用 distance / 4, 最高點不高於 350
        // 4. 設定 maxHeight = myPosition.y + flyOffsetY (拋物線的最高點)
        // 5. 設定 endHeight = targetPos.y (拋物線的結束高度)

        // 6. 抓取子彈起始位置到 this.aimBulletPos
        // 7. 對 this.aimBulletPos 先加上 0.1% 的 diffPos & flyOffsetY 位移量 (避免子彈發射時第一幀朝向錯誤)
        // 8. 計算子彈的朝向 (this.dir) 和速度 (this.vel)

        // 9. 使用 tween 動畫, 對 this.aimBulletPos 執行上升和下降兩段的 Y 軸動畫 (並加上 easeOut 和 easeIn)
        // 10. 使用 tween 動畫, 對 this.aimBulletPos 執行 XZ 平面的移動動畫, 並設定回調函式

        


        // #region 實作時請把這段代碼移除
        myNode.getPosition(this.aimBulletPos);
        tween(this.aimBulletPos)
            .delay(.8).call(() => {
                const entity = this.aimTarget;
                if (!entity || !entity.isUsing()) {    // 確認命中的目標有效
                    this.onMiss();
                    return;
                }
                this.hitTarget = entity;
                this.onHit();
            })
            .start();
        // #endregion 實作時請把這段代碼移除

        console.log(`to do: 請在這裡實作子彈的拋物線飛行`);
        // console.log(to do: 請在這裡實作子彈的拋物線飛行);
                // to do
        // 請實作子彈的拋物線飛行 (使用 tween 動畫)
        // 原理: 將子彈飛行拆成 XZ 平面和 Y 軸兩個部分
        // 1. XZ 平面移動直接走直線過去
        // 2. Y 軸移動拆成上升和下降兩段, 並使用 easeOut 和 easeIn 方式, 模擬加減速的效果
        // 3. 對 this.aimBulletPos 執行上述 tween 動畫
        // 4. 每幀更新子彈節點位置到 this.aimBulletPos 的位置上

        // 已知條件: 目標位置 targetPos, 子彈起始位置 myPosition
        // 已知條件: 子彈到目標的向量 diffPos, 子彈速度 this.speed
        // 1. 先求出 diffPos 的 XZ 距離
        // 2. 計算飛行時間 (不小於 0.5 秒), 距離 / 速度 = 時間
        // 3. 計算飛行的高度位移量 (flyOffsetY), 使用 distance / 4, 最高點不高於 350
        // 4. 設定 maxHeight = myPosition.y + flyOffsetY (拋物線的最高點)
        // 5. 設定 endHeight = targetPos.y (拋物線的結束高度)

        // 6. 抓取子彈起始位置到 this.aimBulletPos
        // 7. 對 this.aimBulletPos 先加上 0.1% 的 diffPos & flyOffsetY 位移量 (避免子彈發射時第一幀朝向錯誤)
        // 8. 計算子彈的朝向 (this.dir) 和速度 (this.vel)

        // 9. 使用 tween 動畫, 對 this.aimBulletPos 執行上升和下降兩段的 Y 軸動畫 (並加上 easeOut 和 easeIn)
        // 10. 使用 tween 動畫, 對 this.aimBulletPos 執行 XZ 平面的移動動畫, 並設定回調函式

        // 計算 XZ 距離
        const horizontalDistance = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);

        // 計算飛行時間（不小於 0.5 秒）
        const minTime = 0.5;
        const flightTime = Math.max(minTime, horizontalDistance / this.speed);

        // 計算拋物線的飛行高度（最高不超過 350）
        let flyOffsetY = horizontalDistance / 4;
        flyOffsetY = Math.min(flyOffsetY, 350);

        const maxHeight = myPosition.y + flyOffsetY;
        const endHeight = targetPos.y;

        // 初始化子彈位置
        myNode.getPosition(this.aimBulletPos);
        this.aimBulletPos.x += diffPos.x * 0.001;
        this.aimBulletPos.z += diffPos.z * 0.001;
        this.aimBulletPos.y = myPosition.y + 0.001;

        // 計算朝向和速度
        this.dir = diffPos.normalize();
        this.vel = diffPos.clone().multiplyScalar(this.speed);

        // Y 軸動畫（上升＋下降）
        const halfTime = flightTime / 2;
        tween(this.aimBulletPos)
            .to(halfTime, { y: maxHeight }, { easing: 'quadOut' })   // 上升
            .to(halfTime, { y: endHeight }, { easing: 'quadIn' })    // 下降
            .start();

        // XZ 平面動畫
        tween(this.aimBulletPos)
            .to(flightTime, { x: targetPos.x, z: targetPos.z })
            .call(() => {
                const entity = this.aimTarget;
                if (!entity || !entity.isUsing()) {
                    this.onMiss();
                    return;
                }
                this.hitTarget = entity;
                this.onHit();
            })
            .start();

    }

    /**
     * 一般子彈的碰撞處理
     */
    private onTriggerEnter(e: ICollisionEvent) {
        if (this.isAiming)    // 鎖定模式, 不觸發物理碰撞
            return;

        const otherCollider = e.otherCollider;
        const hit = otherCollider.getGroup();
        const other = otherCollider.node;

        // to do
        // 監聽事件完成後, 這裡要檢查子彈是否命中怪物或牆壁
        // 如果命中怪物, 需要呼叫 this.entityOnHit(other) 方法
        // 如果命中牆壁, 需要呼叫 this.wallOnHit(other) 方法
        // 請使用 if (hit === physics.PhysicsGroup['XXX']) 來檢查命中物件的物理分組
        // XXX 為你在 Creator 項目設置中的物理分組名稱, 請指定成怪物和牆壁的分組

        if (hit === physics.PhysicsGroup["WALL"]){
            this.wallOnHit(other);
        }else if(hit === physics.PhysicsGroup["MONSTER"]){
            this.entityOnHit(other);
        }

        console.log(`to do: 請在這裡檢查子彈是否命中怪物或牆壁`);
    }

    private entityOnHit(entityNode: Node) {
        const entity = entityNode.getComponent(Monster);
        if (!entity || !entity.isUsing()) {    // 確認命中的目標有效
            this.onMiss();
            return;
        }
        this.hitTarget = entity;
        this.onHit();
    }

    private wallOnHit(wallNode: Node) {
        const abs = Math.abs;
        const { dir, vel } = this;

        // 避免重複觸發, 這裡使用 Math.abs 確保朝向不會反覆橫跳
        switch (wallNode.name) {
            case 'Top': {      // 命中上牆
                dir.z = abs(dir.z);
                vel.z = abs(vel.z);
                break;
            }
            case 'Down': {     // 命中下牆
                dir.z = -abs(dir.z);
                vel.z = -abs(vel.z);
                break;
            }
            case 'Left': {     // 命中左牆
                dir.x = abs(dir.x);
                vel.x = abs(vel.x);
                break;
            }
            case 'Right': {    // 命中右牆
                dir.x = -abs(dir.x);
                vel.x = -abs(vel.x);
                break;
            }
        }

        // 調整子彈的朝向
        this.alignDirection();
    }

    /**
     * 命中目標的處理 (呼叫前請確保命中目標有效)
     */
    private onHit() {
        this.isHit = true;
        this.updateHitWpos2D();

        // 通知系統子彈命中目標
        const hits = Math.floor(ShootBetRate.Normal);
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
            this.node.worldPosition, this.hitWpos2D
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
        hitFx.angle = math.randomRange(0, 360);

        playAnime(hitFx, '', null, () => {
            this.hitFxNode.removeFromParent();
            endFunc();
        });
    }

    /**
     * 清除子彈動作
     */
    private clearBulletAction() {
        if (this.isFlying) {
            Tween.stopAllByTarget(this.rotNode);
            Tween.stopAllByTarget(this.aimBulletPos);
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
        const myNode = this.node;

        // 鎖定子彈跟隨模擬的座標點, 要加上怪物位移量 & 計算角度
        if (this.isAiming) {
            const target = this.aimTarget;
            if (target && target.isUsing()) {
                const targetPos = target.node.position;
                this.targetOffset.set(targetPos).subtract(this.targetStartPos);
            }

            const newPos = tmp_v3_2.set(this.aimBulletPos).add(this.targetOffset);
            this.dir.set(newPos).subtract(myNode.position).normalize();
            this.vel.set(this.dir).multiplyScalar(this.speed);
            myNode.setPosition(newPos);
            this.alignDirection();
        }
        // 一般子彈持續增加固定向量
        else {
            const v = this.vel;
            const p = myNode.position;
            myNode.setPosition(p.x + v.x * dt, p.y, p.z + v.z * dt);
        }
    }

    private alignDirection() {
        const rot = Quat.rotationTo(tmp_quat, Vec3.FORWARD, this.dir);
        this.node.setRotation(rot);
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
