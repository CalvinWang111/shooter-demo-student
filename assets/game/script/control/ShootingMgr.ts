import { _decorator, Component, EventTouch, Node, physics, v3, Vec3 } from 'cc';
import { convert3DPosTo2DPos, convertWorldPosToNodeSpace, getScreenPointByTouch, getWorldPosByTouch, raycast, raycastToGround } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { find, perFrame, setUISize } from '../utils/Utils';
import { makeShootRecord } from '../cannon/ShootRecord';
import { ShootMode } from '../cannon/ShootMode';
import { Monster } from '../monster/Monster';
import { Game } from '../system/Game';

const tmp_v3_1 = v3();
const tmp_v3_2 = v3();
const tmp_v3_3 = v3();

const { ccclass, property } = _decorator;

/**
 * 負責玩家自己的的射擊行為
 */
@ccclass('ShootingMgr')
export class ShootingMgr extends Component {

    /**
     * 處理取消射擊的要做的事 (例如退幣)
     */
    onCancelShootFunc: (type: number, bltID: number, bet: number, cost: number) => void = null;

    shootMode = ShootMode.Normal;                   // 射擊模式
    isAiming = false;                               // 鎖定功能是否啟用中 (有可能還沒有鎖定目標, 或目標無效)

    private isPressing = false;                     // 是否正在按著觸控面板
    private shootWorldPos = v3();                   // 射擊的瞄準位置

    private sightUINode = null as Node;             // 準心圖示的節點
    private sightAimUINode = null as Node;          // 鎖定圖示的節點

    private lastAimingNo = -1;                      // 記錄上次鎖定的目標編號
    private lastAimingID = -1;                      // 記錄上次鎖定的目標流水號
    private aimTarget = null as Monster;            // 瞄準的目標

    private tmpRaycastResults = [] as Node[];       // 射線檢測結果 (檢測完請立即清除)
    private tmpShootRecord = makeShootRecord();     // 射擊記錄物件 (檢查是否射擊成功)
    private coolDownTimer = 9999;                   // 可射擊下一顆子彈的剩餘時間
    private coolDownRate = 1;                       // 射擊冷卻速率
    private nextBltID = 1;                          // 下一顆子彈的編號

    onLoad() {
        Game.shootingMgr = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.shootingMgr = null);

        const { playerLayer } = Game.node;
        this.sightUINode = find(playerLayer, 'UI/Aim/Sight');
        this.sightAimUINode = find(playerLayer, 'UI/Aim/Sight_Aim');
    }

    onDestroy() {
        this.onCancelShootFunc = null;
        this.aimTarget = null;
    }

    update(dt: number) {
        if (Game.gameCtrl.isReadyToPlay())
            this.updateShootingStates(dt);
    }

    start() {
        this.init();
    }

    /**
     * 初始化
     */
    private init() {
        perFrame(this.node, task => {
            if (Game.gameCtrl.isReadyToPlay()) {
                const turret = Game.gameCtrl.getPlayerTurret();
                this.coolDownTimer = turret.cannon.getCoolDownTime();
                this.touchPanelSetup();
                task.stop();
            }
        });
    }

    /**
     * 設定觸控面板的事件 (點擊畫面射擊)
     */
    private touchPanelSetup() {
        const { touchPanel } = Game.node;
        const event = Node.EventType;
        const screenPoint = v3();
        const wpos2D = v3();

        // 點擊事件
        touchPanel.on(event.TOUCH_START, (e: EventTouch) => {
            this.setTouchToShoot(true);
            this.updateTouchPos(event.TOUCH_START, getScreenPointByTouch(e, screenPoint), getWorldPosByTouch(e, wpos2D));
        });
        // 移動事件
        touchPanel.on(event.TOUCH_MOVE, (e: EventTouch) => {
            this.setTouchToShoot(true);
            this.updateTouchPos(event.TOUCH_MOVE, getScreenPointByTouch(e, screenPoint), getWorldPosByTouch(e, wpos2D));
        });
        // 鬆開事件
        touchPanel.on(event.TOUCH_END, (e: EventTouch) => {
            this.setTouchToShoot(false);
        });
        // 取消事件
        touchPanel.on(event.TOUCH_CANCEL, (e: EventTouch) => {
            this.setTouchToShoot(false);
        });
    }

    /**
     * 更新點擊座標
     */
    private updateTouchPos(eventType: string, screenPoint: Readonly<Vec3>, wpos2D: Readonly<Vec3>) {
        raycastToGround(Game.cam3D, screenPoint, 0, this.shootWorldPos);
        this.sightUINode.setWorldPosition(wpos2D);

        const turret = Game.gameCtrl.getPlayerTurret();
        if (turret.cannon.isNeedTarget()) {
            const oldOne = this.aimTarget;                             // Monster | null
            const newOne = this.getTargetByRaycasting(screenPoint);    // Monster | null

            // 炮台需要目標的情況, 且是非鎖定狀態
            if (!this.isAiming) {
                const target = this.aimTarget = newOne;
                if (target) {
                    const wpos = target.node.worldPosition;
                    this.shootWorldPos.set(wpos);
                }
            }
            // 鎖定目標只允許在點擊開始的事件中處理
            else if (eventType === Node.EventType.TOUCH_START) {
                // 確實有點擊到目標才重新賦值
                if (newOne)
                    this.aimTarget = newOne;

                // 若鎖定中又點擊了同一個目標, 則取消鎖定該目標
                if (this.isAiming && oldOne === newOne && oldOne && newOne)
                    this.aimReset();

                const target = this.aimTarget;
                if (target) {
                    const wpos = target.node.worldPosition;
                    this.shootWorldPos.set(wpos);
                }
            }
        }
        else {
            // 炮台不需要目標的情況
            this.aimTarget = null;
        }
    }

    /**
     * 是否點擊畫面發射
     */
    private setTouchToShoot(toggle: boolean) {
        this.sightUINode.active = toggle;
        this.isPressing = toggle;
    }

    /**
     * 檢查是否有點擊到有效的射擊目標
     */
    private getTargetByRaycasting(screenPoint: Readonly<Vec3>): Monster | null {
        this.tmpRaycastResults.length = 0;

        const physGroup = physics.PhysicsGroup;
        const isHit = raycast(Game.cam3D, screenPoint, physGroup['MONSTER'], this.tmpRaycastResults);
        if (!isHit)
            return null;

        let result = null as Monster;
        for (const node of this.tmpRaycastResults) {
            const entity = node.getComponent(Monster);
            if (entity && entity.isUsing()) {
                result = entity;
                break;
            }
        }

        this.tmpRaycastResults.length = 0;
        return result;
    }

    /**
     * 設定鎖定圖示的位置
     */
    private setSightAimUIPos(aimWorldPos3D: Readonly<Vec3>) {
        const wpos = convert3DPosTo2DPos(
            Game.cam3D, Game.cam2D,
            aimWorldPos3D, tmp_v3_3
        );
        this.sightAimUINode.setWorldPosition(wpos);
    }

    /**
     * 播放鎖定的動畫
     */
    private playSightAimUIAiming() {
        if (!this.sightAimUINode.active)
            return;

        playAnime(this.sightAimUINode, 'Sight_Aim', null, () => {
            playAnime(this.sightAimUINode, 'Sight_Aim_Loop');
        });
    }

    /**
     * 更新射擊狀態
     */
    private updateShootingStates(dt: number) {
        // 更新射擊的間隔時間
        this.coolDownTimer = this.coolDownTimer - (dt * this.coolDownRate);
        this.coolDownTimer = Math.max(0, this.coolDownTimer);

        // 檢查鎖定的目標是否還有效
        if (this.isAiming && this.getAimingID() === -1) {
            this.sightAimUINode.active = false;
            this.aimTarget = null;
        }

        // 禁止射擊的情況, 先隱藏鎖定圖示, 暫不清除鎖定的目標
        const turret = Game.gameCtrl.getPlayerTurret();
        if (turret.isLocked()) {
            this.sightAimUINode.active = false;
            return;
        }

        // 狀態檢查
        const isAiming_And_IsNeedTarget = (this.isAiming && turret.cannon.isNeedTarget());

        // 更新鎖定圖示的位置
        // 前面已檢查過, 若鎖定圖示顯示, 代表目標存在且有效
        if (this.sightAimUINode.active && this.aimTarget) {
            const aimWpos3D = this.getAimingWorldPos(this.aimTarget, tmp_v3_2);
            this.setSightAimUIPos(aimWpos3D);

            // 檢查射擊的範圍 (是否在畫面允許的射擊範圍內)
            if (!this.checkShootRangeByPos2D(this.sightAimUINode.position)) {
                this.sightAimUINode.active = false;
                if (isAiming_And_IsNeedTarget)
                    this.aimTarget = null;
            }
        }

        // 子彈射擊檢查
        if (this.coolDownTimer <= 0) {
            // 鎖定功能啟用中, 若當前目標死亡或超出範圍, 則會自動鎖定下一個相同種類的目標
            if (isAiming_And_IsNeedTarget) {
                if (this.aimTarget)
                    this.readyToShoot();
                else if (this.searchAimTargetByNo(this.lastAimingNo))
                    this.readyToShoot();
            }
            // 點擊畫面射擊
            else if (this.isPressing) {
                this.readyToShoot();
            }
        }
    }

    /**
     * 準備發射子彈
     */
    readyToShoot() {
        const { gameCtrl, uiCtrl } = Game;
        const turret = gameCtrl.getPlayerTurret();
        if (turret.isLocked())
            return;

        // 檢查餘額是否足夠
        const shootingCost = turret.cannon.getShootingCost();
        if (shootingCost > gameCtrl.getPlayerCoins()) {
            uiCtrl.toast.show('餘額不足，無法發射子彈！');
            if (this.isAiming) {
                this.sightAimUINode.active = false;
                this.aimTarget = null;
            }
            return;
        }

        // 檢查射擊的範圍 (是否在畫面允許的射擊範圍內)
        if (!this.checkShootRangeByWorldPos3D(this.shootWorldPos))
            return;

        // 射擊前先記錄原先的位置
        const target = this.aimTarget;
        const oldWposX = turret.getWorldPos().x;
        const oldShootWposX = turret.cannon.getShootWorldPosX();
        const offset = oldWposX - oldShootWposX;
        if (target && target.isUsing())
            turret.moveToWorldPosX(target.node.worldPosition.x + offset);
        else
            turret.moveToWorldPosX(this.shootWorldPos.x + offset);

        // 試著射擊子彈
        const playerBet = gameCtrl.getPlayerBet();
        const shootRecord = this.tmpShootRecord;
        turret.cannon.tryToShoot(playerBet, shootingCost, shootRecord);

        // 射擊成功: 扣除玩家子彈花費 & 處理其它狀態
        if (shootRecord.isShot) {
            this.coolDownTimer = turret.cannon.getCoolDownTime();
            gameCtrl.addPlayerCoins(-shootingCost);
            uiCtrl.updatePlayerCoins();

            // 鎖定模式下, 射擊成功表示目標存在且有效
            if (this.isAiming) {
                // 更新射擊位置
                const aimWpos3D = this.getAimingWorldPos(target, tmp_v3_2);
                this.shootWorldPos.set(aimWpos3D);

                // 更新上次鎖定的目標編號
                const lastID = this.lastAimingID;
                const newID = target.getID();
                if (newID !== lastID) {
                    this.lastAimingNo = target.getNo();
                    this.lastAimingID = newID;
                    this.sightAimUINode.active = true;
                    this.setSightAimUIPos(aimWpos3D);
                    this.playSightAimUIAiming();
                }
            }
        }
        // 射擊失敗: 退回炮台原本位置
        else {
            turret.moveToWorldPosX(oldWposX);
        }
    }

    /**
     * 檢查射擊的範圍 (是否在畫面允許的射擊範圍內)
     */
    checkShootRangeByWorldPos3D(wpos3D: Readonly<Vec3>): boolean {
        const wpos2D = convert3DPosTo2DPos(
            Game.cam3D, Game.cam2D,
            wpos3D, tmp_v3_3
        );
        return this.checkShootRangeByWorldPos2D(wpos2D);
    }

    /**
     * 檢查射擊的範圍 (是否在畫面允許的射擊範圍內)
     */
    checkShootRangeByWorldPos2D(wpos2D: Readonly<Vec3>): boolean {
        const pos2D = convertWorldPosToNodeSpace(Game.node.stage, wpos2D, tmp_v3_1);
        return this.checkShootRangeByPos2D(pos2D);
    }

    /**
     * 檢查射擊的範圍 (是否在畫面允許的射擊範圍內)
     */
    checkShootRangeByPos2D(pos2D: Readonly<Vec3>): boolean {
        const uiSize = setUISize(Game.node.stage, -1, -1);
        const halfWidth = uiSize.width * .45;    // (uiSize.width / 2) * 90%
        return Math.abs(pos2D.x) < halfWidth;
    }

    /**
     * 取得射擊的瞄準位置
     */
    getAimingWorldPos(entity: Monster, out?: Vec3): Vec3 {
        const aimNodes = entity.aimNodes;
        const wpos = out ?? v3();

        if (aimNodes.length === 0)
            return wpos.set(entity.node.worldPosition);

        // 若有多個瞄準點, 則優先選擇在射擊範圍內的瞄準點
        for (const aimNode of aimNodes) {
            if (this.checkShootRangeByWorldPos3D(aimNode.worldPosition))
                return wpos.set(aimNode.worldPosition);
        }
        return wpos.set(aimNodes[0].worldPosition);
    }

    /**
     * 搜尋新的瞄準的目標
     */
    private searchAimTargetByNo(aimingNo: number): boolean {
        if (aimingNo !== -1) {
            const entMap = Game.monsterMgr.getEntitiesMap();
            for (const ent of entMap.values()) {
                if (ent.getNo() !== aimingNo || !ent.isUsing())
                    continue;

                const aimWpos3D = this.getAimingWorldPos(ent, tmp_v3_2);
                if (this.checkShootRangeByWorldPos3D(aimWpos3D)) {
                    this.shootWorldPos.set(aimWpos3D);
                    this.aimTarget = ent;
                    if (this.isAiming) {
                        this.sightAimUINode.active = true;
                        this.setSightAimUIPos(aimWpos3D);
                        if (aimingNo !== this.lastAimingNo)
                            this.playSightAimUIAiming()
                    }
                    return true;
                }
            }
        }

        this.sightAimUINode.active = false;
        this.aimTarget = null;
        return false;
    }

    /**
     * 取得瞄準目標的 ID (-1 代表沒有瞄準目標)
     */
    getAimingID(): number | -1 {
        const turret = Game.gameCtrl.getPlayerTurret();
        if (!turret.cannon.isNeedTarget())
            return -1;

        const target = this.aimTarget;
        if (!target || !target.isUsing())
            return -1;

        return target.getID();
    }

    /**
     * 重置瞄準狀態
     */
    aimReset() {
        this.sightAimUINode.active = false;
        this.lastAimingNo = -1;
        this.lastAimingID = -1;
        this.aimTarget = null;
    }

    /**
     * 取消射擊
     */
    cancelShoot(type: number, bltID: number, bet: number, cost: number) {
        this.onCancelShootFunc?.(type, bltID, bet, cost);
    }

    /**
     * 設定射擊冷卻速率
     */
    setCoolDownRate(rate: number) {
        this.coolDownRate = rate;
    }

    /**
     * 取得射擊冷卻速率
     */
    getCoolDownRate(): number {
        return this.coolDownRate;
    }

    /**
     * 查看下一個的子彈編號
     */
    peekNextBulletID(): number {
        return this.nextBltID;
    }

    /**
     * 產生新的子彈編號
     */
    newBulletID(): number {
        return ++this.nextBltID;
    }

}
