import { _decorator, Component, Node, Tween } from 'cc';
import { count, delay, perFrame, poll } from '../utils/Utils';
import { MonsterNo } from '../monster/MonsterNo';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

/**
 * 簡易版實體控制器
 */
@ccclass('Timeline')
export class Timeline extends Component {

    private id = 1;
    private myTween = null as Tween<Node>;

    onDestroy() {
        this.myTween?.stop();
        this.myTween = null;
    }

    start() {
        perFrame(this.node, task => {
            if (Game.gameCtrl.isReadyToPlay()) {
                this.startRunning();
                task.stop();
            }
        });
    }

    /**
     * 單機 Demo, 簡單寫一個腳本循環
     */
    private startRunning() {
        this.myTween = poll(this.node, 153, () => {
            this.playScript_GoldenGiant();
        });
    }

    /**
     * 黃金巨人腳本 (總長 150 秒)
     */
    private playScript_GoldenGiant() {
        const bossJoinTime = 90;     // 巨人進場時間
        const bossLiveTime = 60;     // 巨人存活時間

        const { monsterMgr } = Game;
        const script_1 = new Node('Script_1');
        script_1.setParent(this.node);

        // 左右兩線
        poll(script_1, 18.9, () => {
            count(1, 2, pathNo => {
                delay(script_1, 0.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                delay(script_1, 2.1, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                delay(script_1, 4.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                delay(script_1, 6.1, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                delay(script_1, 8.2, () => monsterMgr.addEntity(MonsterNo.Soldier, this.id++, pathNo));
                delay(script_1, 10.7, () => monsterMgr.addEntity(MonsterNo.Knight, this.id++, pathNo));
                delay(script_1, 13.5, () => monsterMgr.addEntity(MonsterNo.BombGoblin, this.id++, pathNo));
                delay(script_1, 16.5, () => monsterMgr.addEntity(MonsterNo.Medusa, this.id++, pathNo));
            });
        });

        // Boss 來襲宣告 (寫死 200 倍)
        // to do
        // 在 Boss 入場前 3 秒, 播放 Boss 來襲宣告的介面
        // 1. bossJoinTime - 3 時, 先玩家停止射擊 Game.gameCtrl.getPlayerTurret().setLock()
        // 2. 播放 Boss 來襲宣告的介面 Game.effectMgr.showBossComing()
        // 3. 播放完後, 解鎖停止射擊
        console.log(`to do: 需要在 Boss 入場前 3 秒時, 添加 Boss 來襲宣告`);
        const turret = Game.gameCtrl.getPlayerTurret();
        delay(this.node, bossJoinTime - 3, () => {
            turret.setLock(false);
            Game.effectMgr.showBossComing(200, ()=> {
                turret.setLock(false);
            });
        });

        // 巨人進場 (巨人路徑寫死 101 編號)
        delay(script_1, bossJoinTime, () => {
            Tween.stopAllByTarget(script_1);
            monsterMgr.addEntity(MonsterNo.GoldenGiant, this.id++, 101);

            poll(script_1, 17.9, () => {
                count(3, 4, pathNo => {
                    delay(script_1, 0.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                    delay(script_1, 3.1, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                    delay(script_1, 6.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                    delay(script_1, 9.1, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                    delay(script_1, 12.2, () => monsterMgr.addEntity(MonsterNo.Soldier, this.id++, pathNo));
                    delay(script_1, 15.5, () => monsterMgr.addEntity(MonsterNo.Knight, this.id++, pathNo));
                });
            });

            poll(script_1, 20.4, () => {
                count(5, 6, pathNo => {
                    delay(script_1, 0.1, () => monsterMgr.addEntity(MonsterNo.Knight, this.id++, pathNo));
                    delay(script_1, 4.0, () => monsterMgr.addEntity(MonsterNo.Soldier, this.id++, pathNo));
                    delay(script_1, 7.6, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                    delay(script_1, 11.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                    delay(script_1, 14.6, () => monsterMgr.addEntity(MonsterNo.Viking, this.id++, pathNo));
                    delay(script_1, 18.1, () => monsterMgr.addEntity(MonsterNo.Archer, this.id++, pathNo));
                });
            });

            // 巨人即將離場, 停止出怪
            delay(script_1, bossLiveTime - 6, () => {
                Tween.stopAllByTarget(script_1);
                script_1.destroy();
            });
        });
    }

}
