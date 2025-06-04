import { _decorator, Component, error, Vec3 } from 'cc';
import { shuffleSelf } from '../utils/Utils';
import { BulletData } from '../bullet/BulletData';
import { Monster } from '../monster/Monster';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('MonsterMgr')
export class MonsterMgr extends Component {

    private entities = new Map<number, Monster>();    // 目前場景中正在運行的實體

    onLoad() {
        Game.monsterMgr = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.monsterMgr = null);
    }

    onDestroy() {
        this.entities.clear();        // 節點在場景上, 由 Creator 自動銷毀
    }

    /**
     * 新增怪物到場景上
     */
    addEntity(no: number, id: number, pathNo: number): Monster | null {
        const entity = Game.dataMgr.getMonsterNode(no)?.getComponent(Monster);
        if (!entity) {
            error(`Monster adding failed. No: ${no}, ID: ${id}.`);
            return null;
        }

        const entMap = this.entities;
        if (entMap.has(id)) {
            error(`Monster already exists. ID: ${id}.`);
            Game.dataMgr.putToMonsterPool(entity.node, no);
            return null;
        }

        const entNode = entity.node;
        entNode.name = `Monster_${id}`;
        entNode.setParent(Game.node.enemyLayer);
        entity.init(no, id);

        const hasPath = entity.setMovePath(pathNo);
        if (!hasPath) {
            error(`Monster has no path. PathNo: ${pathNo}.`);
            Game.dataMgr.putToMonsterPool(entity.node, no);
            return null;
        }

        entity.postInit();
        entMap.set(id, entity);
        return entity;
    }

    /**
     * 怪物被命中的處理 (單機 Demo, 擊殺判定寫在 Client 端)
     */
    entityOnHit(entity: Monster, bltData: Readonly<BulletData>) {
        if (!Game.gameCtrl.checkKill(entity, bltData))
            return;

        const winNum = entity.getOdds() * bltData.bet;
        const given = entity.showReward(winNum);
        if (!given) {
            Game.gameCtrl.addPlayerCoins(winNum);
            Game.uiCtrl.updatePlayerCoins();
        }
        entity.showDeath();
    }

    /**
     * 從實體的對應表中移除指定實體
     */
    removeFromEntitiesMap(id: number): Monster | null {
        const entMap = this.entities;
        const entity = entMap.get(id) ?? null;
        if (entity) entMap.delete(id);
        return entity;
    }

    /**
     * 清除場上所有實體, 並將實體回收到各自的 Pool 中
     */
    clearAllEntities() {
        const entMap = this.entities;
        const entities = Array.from(entMap.values());    // 避免移除過程中, 長度發生改變
        entities.forEach(ent => ent.pushToPool());       // 將實體回收到 Pool 中
        entMap.clear();                                  // 清除對應表
    }

    /**
     * 取得場上全部實體的對應表
     */
    getEntitiesMap(): Readonly<Map<number, Monster>> {
        return this.entities;
    }

    /**
     * 取得場上的全部實體
     */
    getAllEntities(out?: Monster[]): Monster[] {
        const entMap = this.entities;
        if (out) {
            for (const ent of entMap.values()) {
                out.push(ent);
            }
            return out;
        }
        return Array.from(entMap.values());
    }

    /**
     * 取得範圍內的實體
     */
    getEntitiesInRange(wpos3D: Readonly<Vec3>, radius: number, sumOdds: number = -1, condition?: (entity: Monster) => boolean): Monster[] {
        const list = this.getAllEntities();
        const rr = radius * radius;

        if (!condition) {
            condition = (entity: Monster) => {    // 預設只針對普通小怪
                return entity.isNormalMonster && entity.isUsing();
            };
        }

        // Demo 版簡單寫, 不計算碰撞體體積
        let i = 0;
        while (i < list.length) {
            const ent = list[i];
            const dist = Vec3.squaredDistance(wpos3D, ent.node.worldPosition);
            if (dist > rr || !condition(ent)) {
                if (list.length >= 2) {
                    const last = list.length - 1;
                    [list[i], list[last]] = [list[last], list[i]];    // 將不符合條件的實體移到最後面
                }
                list.pop();
                continue;
            }
            ++i;
        }

        // 洗亂實體順序
        shuffleSelf(list);

        // 計算倍率總和
        if (sumOdds > 0) {
            let sum = 0;
            for (let i = 0, len = list.length; i < len; ++i) {
                const ent = list[i];
                sum += ent.getOdds();
                if (sum >= sumOdds) {
                    list.length = i + 1;
                    break;
                }
            }
        }

        return list;
    }

    /**
     * 依流水號取得場上實體
     */
    getEntityByID(id: number): Monster | null {
        return this.entities.get(id) ?? null;
    }

}
