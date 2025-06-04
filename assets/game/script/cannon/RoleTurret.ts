import { _decorator, Component, v3, Vec3 } from 'cc';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { perFrame } from '../utils/Utils';
import { RoleCannon } from './RoleCannon';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('RoleTurret')
export class RoleTurret extends Component {

    /**
     * 當前玩家使用的炮台
     */
    cannon = null as RoleCannon;

    private locked = false;    // 是否禁止發射

    onLoad() {
        this.addCannon();
    }

    private addCannon() {
        const pivot = Game.node.cannonLayer.children[0];
        const cannonNode = Game.dataMgr.getQueenCannonNode();
        this.cannon = cannonNode.getComponent(RoleCannon);
        cannonNode.setRotationFromEuler(0, 180, 0);
        cannonNode.setParent(pivot);

        // 等待其它元件準備好後再開始
        perFrame(this.node, task => {
            if (Game.gameCtrl.isReadyToPlay()) {
                this.cannon.equip();
                task.stop();
            }
        });
    }

    /**
     * 移動炮台到指定的世界座標位置
     */
    moveToWorldPosX(wposX: number) {
        const pivot = this.cannon.node.parent;
        const wpos = pivot.worldPosition;
        pivot.setWorldPosition(wposX, wpos.y, wpos.z);
        this.showLocationHint(false);
    }

    /**
     * 炮台的世界座標位置
     */
    getWorldPos(): Readonly<Vec3> {
        const pivot = this.cannon.node.parent;
        return pivot.worldPosition;
    }

    /**
     * 是否禁止發射
     */
    isLocked(): boolean {
        return this.locked;
    }

    /**
     * 設定禁止發射
     */
    setLock(toggle: boolean) {
        this.locked = toggle;
    }

    /**
     * 顯示位置提示
     */
    showLocationHint(toggle: boolean) {
        const hintNode = Game.uiCtrl.locationHintNode;
        hintNode.active = toggle;

        if (toggle) {
            const hintWpos = hintNode.worldPosition;
            const wpos = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, this.getWorldPos());
            hintNode.setWorldPosition(wpos.x, hintWpos.y, hintWpos.z);
        }
    }

}
