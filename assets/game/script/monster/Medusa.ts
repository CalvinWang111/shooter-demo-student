import { _decorator, AnimationClip, instantiate, math, Node, Prefab, tween, v3 } from 'cc';
import { delay, lastItem, perFrame, rItem, setPosY } from '../utils/Utils';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { shake2D } from '../utils/Shake2D';
import { OnBoardMonster } from './OnBoardMonster';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

const wrapMode = AnimationClip.WrapMode;

const { ccclass, property } = _decorator;

@ccclass('Medusa')
export class Medusa extends OnBoardMonster {

    // #region Properties
    @property(Node)
    heartFxNode: Node = null;                    // 心型特效

    @property(Prefab)
    petrificationFxPrefab: Prefab = null;        // 石化特效

    @property(Prefab)
    magicLightFxPrefab: Prefab = null;           // 石化魔法陣

    @property(Prefab)
    stoneBrokenFxPrefab: Prefab = null;          // 石化破碎特效
    // #endregion

    init(no: number, id: number) {
        super.init(no, id);

        // 特殊怪物有多個賠率, 顯示最高多少賠率
        this.oddsIndex = math.randomRangeInt(0, this.oddsList.length);
        this.oddsText.string = `X${lastItem(this.oddsList)}`;
    }

    protected playIdle() {
        const charAnims = this.monsterAnims;
        if (Math.random() < .333) {
            playAnime(charAnims[0], 'idle01');
        }
        else {
            const clipName = rItem(['idle02', 'idle03']);
            playAnime(charAnims[0], clipName, wrapMode.Normal, () => {
                playAnime(charAnims[0], 'idle01');
            });

            // 播放心型特效
            if (clipName === 'idle03') {
                playAnime(this.heartFxNode, '', wrapMode.Normal);
            }
        }
    }

    /**
     * 播放梅杜莎的石化演出 (梅杜莎不會復活)
     */
    showReward(winNum: number): boolean {
        this.using = false;
        this.canShowHurt = false;
        this.colliders.forEach(c => c.enabled = false);

        // 先除名, 避免被其它功能重複抓取到
        Game.monsterMgr.removeFromEntitiesMap(this.id);

        // 播放石化特效
        const { monsterAnims: charAnims, node: myNode } = this;
        const wpos2D = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, myNode.worldPosition);
        const petrif = instantiate(this.petrificationFxPrefab);
        petrif.setParent(Game.node.effect2DLayer);
        petrif.setWorldPosition(wpos2D);
        playAnime(petrif, '', wrapMode.Normal, () => {
            petrif.destroy();
        });

        // 移動石化特效到畫面中央
        tween(petrif)
            .delay(.5).call(() => {
                Game.sndMgr.playOneShot('Medusa_01');
            })
            .to(.25, { position: v3(0, 60, 0) }).call(() => {
                Game.sndMgr.playOneShot('Medusa_02');
            })
            .start();

        // 梅杜莎施法
        this.stopFloating();
        playAnime(charAnims[0], 'attack', wrapMode.Normal);
        delay(myNode, .7, () => this.showPetrification());       // 小怪被石化

        // 浮島沉沒噴金幣
        delay(myNode, 2.7, () => {
            this.reuse = false;
            Game.sndMgr.playOneShot('Water_Splash_Small');
            playAnime(this.commonAnim, 'NoFallDead', null, () => {
                myNode.destroy();    // 表演過就不複用了, 動畫結束後直接銷毀
            });

            const fxMgr = Game.effectMgr;
            const waterH = fxMgr.getWaterHeight();
            const coinUIPos = Game.uiCtrl.getPlayerCoinUIWpos3D();
            const startPos = v3(myNode.worldPosition);

            // 避免金幣掉在怪物身體裡
            startPos.y = waterH; startPos.z += 40;
            fxMgr.showGetCoins(startPos, coinUIPos, winNum, () => {
                Game.gameCtrl.addPlayerCoins(winNum);
                Game.uiCtrl.updatePlayerCoins();
            });

            // 銷毀時會主動清除 Monster 節點上的定時器
            delay(myNode, .3, () => {
                const wpos = v3(myNode.worldPosition); wpos.y = waterH;
                Game.effectMgr.playWaterSplashFx(wpos, 2, false);
            });
        });

        return true;
    }

    /**
     * 小怪被石化
     */
    private showPetrification() {
        const myNode = this.node;
        const wpos2D = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, myNode.worldPosition);
        const entities = Game.monsterMgr.getEntitiesInRange(wpos2D, 700, this.getOdds());

        const waterH = Game.effectMgr.getWaterHeight();
        const coinUIPos = Game.uiCtrl.getPlayerCoinUIWpos3D();

        // 兩秒後石化破碎
        const brokenFxPrefab = this.stoneBrokenFxPrefab;
        delay(Game.gameCtrl.timer, 2, () => {
            shake2D(Game.cam3D.node, .8, 25, 4, .97);
        });

        for (const ent of entities) {
            if (!ent.isUsing() || !ent.node)
                continue;

            ent.setUsing(false);
            ent.colliders.forEach(c => c.enabled = false);

            // 先除名, 避免被其它功能重複抓取到
            Game.monsterMgr.removeFromEntitiesMap(ent.getID());

            // 播放魔法陣特效
            // to do
            // 請生成魔法陣特效, 並隨著怪物一起移動
            // 1. 使用 this.magicLightFxPrefab 生成魔法陣特效, 設定父節點為 Game.node.effect3DLayer
            // 2. 設定魔法陣特效的世界座標為 ent.node.worldPosition
            // 3. 使用 perFrame() 將魔法陣特效的世界座標隨著 ent.node 一起移動 (需檢查 ent.node 是否存在)
            // 4. 播放魔法陣特效的動畫 (動畫代空字串表示播放預設動畫), 播放結束後銷毀魔法陣特效
            console.log(`to do: 請在這裡實作魔法陣特效`);

            const magicFx = instantiate(this.magicLightFxPrefab);
            magicFx.setParent(Game.node.effect3DLayer);
            magicFx.setWorldPosition(ent.node.worldPosition);
            perFrame(magicFx, () => {
                if (ent && ent.node){
                    magicFx.setWorldPosition(ent.node.worldPosition);
                }
            });
            playAnime(magicFx, '', wrapMode.Normal, ()=>{
                magicFx.destroy();
            })

            // to do
            // 將怪物轉成灰階
            // 1. 停止怪物身上的所有動畫 (ent.monsterAnims)
            // 2. 設定怪物的灰度值為 1 (ent.setGrayScale)
            // 3. 設定怪物不再重複使用 (ent.setReuse)
            console.log(`to do: 請在這裡將怪物轉成灰階`);
            ent.monsterAnims.forEach(anim => {
                anim.stop();
            });
            if (ent instanceof OnBoardMonster){
                ent.boardAnim.stop();
            }
            ent.setGrayScale(1);
            ent.setReuse(false);

            tween(ent.node)
                .delay(2).call(() => {
                    // to do
                    // 播放石化破碎特效
                    // 1. 使用 this.brokenFxPrefab 生成石化破碎特效, 設定父節點為 Game.node.effect3DLayer
                    // 2. 設定石化破碎特效的世界座標為 ent.node.worldPosition
                    // 3. 調整石化破碎特效的 y 軸位置比 ent.node.worldPosition 高 30
                    // 4. 播放石化破碎特效的動畫 (動畫代空字串表示播放預設動畫), 播放結束後銷毀石化破碎特效
                    console.log(`to do: 請在這裡實作石化破碎特效`);

                    const brokenFx = instantiate(this.stoneBrokenFxPrefab);
                    brokenFx.setParent(Game.node.effect3DLayer);
                    brokenFx.setWorldPosition(ent.node.worldPosition);
                    setPosY(brokenFx, brokenFx.position.y + 30);
                    playAnime(brokenFx, '', null, () => {
                        brokenFx.destroy;
                    });
                })
                .delay(.1).call(() => {
                    // 隱藏怪物主體
                    ent.monsterAnims[0].node.setPosition(0, -1e5, 0);

                    const startPos = v3(ent.node.worldPosition); startPos.y = waterH;
                    startPos.z += 40;
                    Game.effectMgr.showGetCoins(startPos, coinUIPos, 0);

                    startPos.z -= 40;
                    delay(ent.node, .4, () => {
                        Game.effectMgr.playWaterSplashFx(startPos, 1, false);
                    });

                    // 石化過後的怪物, 直接沉沒並銷毀不複用了
                    tween(ent.node.children[0])
                        .by(.8, TwUtils.props.position_0_n100_0)
                        .call(() => ent.node.destroy())
                        .start();
                })
                .start();
        }
    }

    /**
     * 梅杜莎的死亡改由 showReward() 來處理
     */
    showDeath() { /* 這裡不實作 */ }

}
