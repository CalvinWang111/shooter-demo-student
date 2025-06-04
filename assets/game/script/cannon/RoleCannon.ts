import { _decorator, AnimationClip, Component, instantiate, Node, Prefab, v3, Vec3 } from 'cc';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { find, rInt } from '../utils/Utils';
import { makeShootRecord, ShootRecord } from './ShootRecord';
import { ShootBetRate } from './ShootBetRate';
import { ShootMode } from './ShootMode';
import { NormalBullet } from '../bullet/NormalBullet';
import { AxeBullet } from '../bullet/AxeBullet';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('RoleCannon')
export class RoleCannon extends Component {

    // #region Properties
    @property(Node)
    normalCannonPivot: Node = null;

    @property([Node])
    axeThrowPivots: Node[] = [];

    @property(Prefab)
    normalCannonPrefab: Prefab = null;

    @property(Prefab)
    changeFxPrefab: Prefab = null;
    // #endregion

    private roleNode = null as Node;
    private cannonNode = null as Node;
    private cannonTapOnNode = null as Node;
    private cannonGunFireNode = null as Node;

    private axeHandSide = 0;    // 飛斧使用的順序 (左手或右手)

    onLoad() {
        this.roleNode = find(this.node, 'RootNode');
        this.cannonNode = instantiate(this.normalCannonPrefab);
        this.cannonTapOnNode = this.cannonNode.getChildByName('TapOn');
        this.cannonGunFireNode = this.cannonNode.getChildByName('GunFire');
        this.cannonNode.setParent(this.normalCannonPivot);
        this.axeHandSide = rInt(0, 1);
    }

    /**
     * 切換炮台功能
     */
    equip() {
        this.playIdle();
        this.playChangeFx();
    }

    /**
     * 嘗試發射一顆子彈
     */
    tryToShoot(bet: number, cost: number, out?: ShootRecord): ShootRecord {
        const { dataMgr, shootingMgr } = Game;
        const record = out ?? makeShootRecord();
        const mode = shootingMgr.shootMode;

        record.bltID = 0; record.bltBet = bet, record.bltCost = cost;
        record.aimingID = shootingMgr.getAimingID();
        record.shootMode = mode;
        record.isShot = false;

        switch (mode) {
            case ShootMode.Normal:
            case ShootMode.Normal_Aim: {
                const bltNode = dataMgr.getNormalBulletNode();
                const bltComp = bltNode.getComponent(NormalBullet);
                const bltWpos = this.getMuzzleWorldPos();
                bltNode.setParent(Game.node.bulletLayer);
                record.isShot = bltComp.init(bltWpos, shootingMgr.peekNextBulletID(), bet, cost, record.aimingID, () => {
                    dataMgr.putToNormalBulletPool(bltNode);
                });
                break;
            }
            case ShootMode.Axe: {
                const bltNode = dataMgr.getAxeBulletNode();
                const bltComp = bltNode.getComponent(AxeBullet);
                const bltWpos = this.getMuzzleWorldPos();
                bltNode.setParent(Game.node.bulletLayer);
                record.isShot = bltComp.init(bltWpos, shootingMgr.peekNextBulletID(), bet, cost, record.aimingID, this.axeHandSide, () => {
                    dataMgr.putToAxeBulletPool(bltNode);
                });
                break;
            }
        }

        // 成功才播放射擊動作
        if (record.isShot) {
            record.bltID = shootingMgr.newBulletID();    // 射擊成功才給予新的子彈編號
            this.playShoot();
        }
        return record;
    }

    /**
     * 取得子彈發射的位置
     */
    getMuzzleWorldPos(): Readonly<Vec3> {
        const mode = Game.shootingMgr.shootMode;
        switch (mode) {
            case ShootMode.Normal:
            case ShootMode.Normal_Aim: {
                const muzzle = this.cannonNode.children[0]!.children[0]!;
                return muzzle.worldPosition;
            }
            case ShootMode.Axe: {
                const pivot = this.axeThrowPivots[this.axeHandSide];
                return pivot.worldPosition;
            }
        }
    }

    /**
     * 取得發射時炮台 X 軸的位置
     */
    getShootWorldPosX(): number {
        const mode = Game.shootingMgr.shootMode;
        switch (mode) {
            case ShootMode.Normal:
            case ShootMode.Normal_Aim: {
                return this.getMuzzleWorldPos().x;
            }
            case ShootMode.Axe: {
                const pivot = this.node.parent;
                return pivot.worldPosition.x;
            }
        }
    }

    /**
     * 是否必須指定目標射擊
     */
    isNeedTarget(): boolean {
        const mode = Game.shootingMgr.shootMode;
        if (mode === ShootMode.Normal) return false;
        if (mode === ShootMode.Normal_Aim) return true;
        if (mode === ShootMode.Axe) return true;
    }

    /**
     * 取得當前的射擊成本
     */
    getShootingCost(): number {
        const betNum = Game.gameCtrl.getPlayerBet();
        const mode = Game.shootingMgr.shootMode;
        if (mode === ShootMode.Normal) return betNum * ShootBetRate.Normal;
        if (mode === ShootMode.Normal_Aim) return betNum * ShootBetRate.Normal;
        if (mode === ShootMode.Axe) return betNum * ShootBetRate.Axe;
    }

    /**
     * 取得射擊冷卻時間
     */
    getCoolDownTime(): number {
        const mode = Game.shootingMgr.shootMode;
        if (mode === ShootMode.Normal) return .2;
        if (mode === ShootMode.Normal_Aim) return .2;
        if (mode === ShootMode.Axe) return .25;
    }

    private playIdle() {
        const mode = Game.shootingMgr.shootMode;
        switch (mode) {
            case ShootMode.Normal: {
                playAnime(this.node, 'Cannon_Idle');
                playAnime(this.roleNode, 'Cannon_Idle');
                break;
            }
            case ShootMode.Normal_Aim: {
                playAnime(this.node, 'Aim_Idle');
                playAnime(this.roleNode, 'Aim_Idle');
                break;
            }
            case ShootMode.Axe: {
                playAnime(this.node, 'Axe_Idle');
                playAnime(this.roleNode, 'Axe_Idle');
                break;
            }
        }
    }

    private playShoot() {
        const wrapMode_Normal = AnimationClip.WrapMode.Normal;
        const mode = Game.shootingMgr.shootMode;
        switch (mode) {
            case ShootMode.Normal: {
                playAnime(this.node, 'Cannon_Attack');
                playAnime(this.roleNode, 'Cannon_Attack', wrapMode_Normal, () => this.playIdle());
                playAnime(this.cannonNode, '', wrapMode_Normal);
                playAnime(this.cannonGunFireNode);
                playAnime(this.cannonTapOnNode);
                Game.sndMgr.playOneShot('Shoot_Normal');
                break;
            }
            case ShootMode.Normal_Aim: {
                playAnime(this.node, 'Aim_Attack');
                playAnime(this.roleNode, 'Aim_Attack', wrapMode_Normal, () => this.playIdle());
                playAnime(this.cannonNode, '', wrapMode_Normal);
                playAnime(this.cannonGunFireNode);
                playAnime(this.cannonTapOnNode);
                Game.sndMgr.playOneShot('Shoot_Normal');
                break;
            }
            case ShootMode.Axe: {
                const clipName = (this.axeHandSide === 0) ? 'Axe_Attack_L' : 'Axe_Attack_R';
                playAnime(this.node, clipName);
                playAnime(this.roleNode, clipName, wrapMode_Normal, () => this.playIdle());
                Game.sndMgr.playOneShot('Shoot_Axe');
                this.axeHandSide ^= 1;
                break;
            }
        }
    }

    private playChangeFx() {
        const wpos2D = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, this.node.worldPosition);
        wpos2D.y += 50;

        const fxNode = instantiate(this.changeFxPrefab);
        fxNode.setParent(Game.node.effect2DLayer);
        fxNode.setWorldPosition(wpos2D);
        playAnime(fxNode, '', null, () => {
            fxNode.destroy();
        });
    }

}
