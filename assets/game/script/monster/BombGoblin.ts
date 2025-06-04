import { _decorator, AnimationClip, game, instantiate, math, Node, ParticleSystem2D, Prefab, tween, v3 } from 'cc';
import { delay, find, lastItem, perFrame, rItem } from '../utils/Utils';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { OnBoardMonster } from './OnBoardMonster';
import { shake2D } from '../utils/Shake2D';
import { Game } from '../system/Game';

const wrapMode = AnimationClip.WrapMode;

const { ccclass, property } = _decorator;

@ccclass('BombGoblin')
export class BombGoblin extends OnBoardMonster {

    // #region Properties
    @property(Node)
    lightBGNode: Node = null;              // 背景光

    @property(Prefab)
    explosionPrefab: Prefab = null;        // 爆炸特效

    @property(Prefab)
    glassBrokenFxPrefab: Prefab = null;    // 玻璃破碎特效
    // #endregion

    init(no: number, id: number) {
        super.init(no, id);

        // 特殊怪物有多個賠率, 顯示最高多少賠率
        this.oddsIndex = math.randomRangeInt(0, this.oddsList.length);
        this.oddsText.string = `X${lastItem(this.oddsList)}`;
    }

    revival(onStandFunc?: Function, onInGameEndFunc?: Function) {
        this.oddsIndex = math.randomRangeInt(0, this.oddsList.length);
        this.lightBGNode.active = false;

        const onStandFunc2 = () => {
            this.lightBGNode.active = true;
            this.lightBGNode.getComponentsInChildren(ParticleSystem2D).forEach(ps => {
                ps.resetSystem();
                ps._simulator.step(0);    // creator 3.6 bug (強制步進, 避免顯示上一幀殘留的粒子)
            });
            onStandFunc?.();
        };

        super.revival(onStandFunc2, onInGameEndFunc);
    }

    /**
     * 播放炸彈哥布林的爆炸演出 (炸彈哥布林不會復活)
     */
    showReward(winNum: number): boolean {
        this.using = false;
        this.canShowHurt = false;
        this.colliders.forEach(c => c.enabled = false);

        // 先除名, 避免被其它功能重複抓取到ㄇ
        Game.monsterMgr.removeFromEntitiesMap(this.id);

        // 生成爆炸模型
        // to do
        // 使用 this.explosionPrefab 來生成爆炸模型節點
        // 1. 爆炸模型的父節點要設為 Game.node.effect3DLayer
        // 2. 爆炸模型的世界座標要設為這個炸彈哥布林的世界座標
        // 3. 播放爆炸模型的動畫 (動畫代空字串表示播放預設動畫), 動畫結束後銷毀這個模型節點
        console.log(`to do: 請在這裡生成爆炸模型並播放動畫`);

        const boom = instantiate(this.explosionPrefab);
        boom.setParent(Game.node.effect3DLayer);
        boom.setWorldPosition(this.node.worldPosition);
        playAnime(boom, '',wrapMode.Normal,() =>{
            boom.destroy();
        });


        // 播放爆炸震動
        const myNode = this.node;
        delay(myNode, .65, () => {
            shake2D(Game.cam3D.node, 1.3, 25, 10, .97);
        });

        const fxMgr = Game.effectMgr;
        const waterH = fxMgr.getWaterHeight();
        const coinUIPos = Game.uiCtrl.getPlayerCoinUIWpos3D();

        // 小怪被炸飛
        delay(myNode, .65, () => {
            const wpos3D = this.node.worldPosition;
            const entities = Game.monsterMgr.getEntitiesInRange(wpos3D, 500, this.getOdds());
            fxMgr.makeMonsterFly(wpos3D, entities, ent => {
                // 避免金幣掉在怪物身體裡
                const startPos = v3(ent.node.worldPosition);
                startPos.y = waterH; startPos.z += 40;
                delay(Game.gameCtrl.timer, 1.3, () => {
                    fxMgr.showGetCoins(startPos, coinUIPos, 0);
                });
            });
            delay(Game.gameCtrl.timer, .3, () => {
                Game.sndMgr.playOneShot('Water_Splash_Small');
            });
        });

        // 炸彈哥布林被炸飛
        this.stopFloating();
        this.showBombGoblinFly();

        // 浮島沉沒噴金幣
        delay(myNode, 2, () => {
            this.reuse = false;
            Game.sndMgr.playOneShot('Water_Splash_Small');
            playAnime(this.commonAnim, 'NoFallDead', null, () => {
                myNode.destroy();    // 表演過就不複用了, 動畫結束後直接銷毀
            });

            // 避免金幣掉在怪物身體裡
            const startPos = v3(myNode.worldPosition);
            startPos.y = waterH; startPos.z += 40;
            fxMgr.showGetCoins(startPos, coinUIPos, winNum, () => {
                Game.gameCtrl.addPlayerCoins(winNum);
                Game.uiCtrl.updatePlayerCoins();
            });

            // 銷毀時會主動清除 Monster 節點上的定時器
            delay(myNode, .3, () => {
                const wpos = v3(myNode.worldPosition); wpos.y = waterH;
                fxMgr.playWaterSplashFx(wpos, 2, false);
            });
        });

        return true;
    }

    /**
     * 炸彈哥布林快速飛到原地上空, 然後自轉 + 往鏡頭飛 + 放大 + 撞到玻璃 + 下滑
     */
    private showBombGoblinFly() {
        const { monsterAnims: charAnims, node: myNode } = this;
        playAnime(charAnims[0], 'idle01');
        this.lightBGNode.active = false;
        this.reuse = false;

        // 起飛到撞到玻璃時間為 2 秒
        const flyTime = 1;
        const diffDist = 25 / flyTime;
        const diffScale = 2 / flyTime;
        const diffRotX = rItem([-1400, 1400]) / flyTime;
        const dropTime = 1, startDropTime = 1.8, dropG = 70;

        let time = 0
        let dropMove = 20 / dropTime;
        let isGlassBroken = false;

        delay(myNode, .65, () => {
            charAnims[0].stop();
            Game.sndMgr.playOneShot('Boom_Fly');

            const bipNode = find(charAnims[0].node, 'Bip001');      // 抓取哥布林的中央骨骼節點, 方便自轉
            const makeGoblinToFly = () => {
                perFrame(myNode, task => {
                    const dt = Math.min(.1, game.deltaTime);    // 避免幀率不穩
                    if (time >= startDropTime + dropTime) {
                        task.stop();
                        return;
                    }

                    if (time < flyTime) {
                        // 自轉 + 往鏡頭飛 + 放大
                        const pos = bipNode.position;
                        const rot = bipNode.eulerAngles;
                        const new_scale = bipNode.scale.x + (diffScale * dt);
                        bipNode.setScale(new_scale, new_scale, new_scale);
                        bipNode.setPosition(pos.x, pos.y, pos.z + (diffDist * dt));
                        bipNode.setRotationFromEuler(rot.x + (diffRotX * dt), rot.y, rot.z);
                    }
                    else if (time >= flyTime && !isGlassBroken) {
                        // to do
                        // 播放玻璃破碎特效
                        // 1. 使用 convert3DPosTo2DPos() 將 bipNode 的世界座標轉換為 2D 世界座標 (Game.cam3D, Game.cam2D)
                        // 2. 使用 this.glassBrokenFxPrefab 生成節點, 父節點設為 Game.node.effect2DLayer
                        // 3. 設定節點的世界座標為轉換後的 2D 世界座標
                        // 4. 播放動畫 (空字串表示播放預設動畫), 動畫結束後銷毀這個節點
                        console.log(`to do: 請在這裡實作玻璃破碎特效`);

                        const wpos2D = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, bipNode.worldPosition);
                        const glassFx = instantiate(this.glassBrokenFxPrefab);
                        glassFx.setParent(Game.node.effect2DLayer);
                        glassFx.setWorldPosition(wpos2D);
                        playAnime(glassFx, '', null, () => {
                            glassFx.destroy();
                        });

                        Game.sndMgr.playOneShot('Glass_Broken');
                        isGlassBroken = true;
                    }
                    else if (time > startDropTime && time < startDropTime + dropTime) {
                        // 下滑
                        const pos = bipNode.position;
                        bipNode.setPosition(pos.x, pos.y - (dropMove * dt), pos.z);
                        dropMove += dropG * dt;
                    }
                    time += dt;
                });
            };

            // 快速移到上空
            tween(bipNode)
                .to(.1, { position: v3(0, math.randomRange(5, 7), 0) })
                .call(makeGoblinToFly)
                .start();
        });
    }

    /**
     * 炸彈哥布林的死亡改由 showReward() 來處理
     */
    showDeath() { /* 這裡不實作 */ }

}
