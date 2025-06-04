import { _decorator, AnimationClip, instantiate, math, Prefab, Tween, tween, v3 } from 'cc';
import { delay, easeIn, find, poll, rInt, rItem } from '../utils/Utils';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { shake2D } from '../utils/Shake2D';
import { Monster } from './Monster';
import { ClockTimerUI } from '../toolbox/ClockTimerUI';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

const wrapMode = AnimationClip.WrapMode;

@ccclass('GoldenGiant')
export class GoldenGiant extends Monster {

    @property(Prefab)
    attackFxPrefab: Prefab = null;         // 攻擊特效

    @property(Prefab)
    clockTimerUIPrefab: Prefab = null;     // 計時器 UI

    private canShowHurt = true;            // 是否可以顯示受傷動畫
    private tagAttack = 1247;              // 攻擊特效的 Tag

    postInit() {
        this.using = false;
        this.canShowHurt = false;

        const fxMgr = Game.effectMgr;
        const charAnims = this.monsterAnims;
        const bipNode = find(charAnims[0], 'Root/Bip001');    // 中心點

        // to do
        // Boss 的水波效果
        // 1. 使用 poll(this.node, .75, () => {...}) 來持續播放水波效果
        // 2. 指定位置為 bipNode.worldPosition, 隨機大小 3.5 ~ 4.5, 不需要濺起水花
        console.log(`to do: 請播放 Boss 的水波效果`);

        poll(this.node, .75, ()=>{
            fxMgr.playWaterSplashFx(bipNode.worldPosition, math.randomRange(3.5, 4.5), false);
        });

        // 進場動畫, Boss 破水而出
        Game.sndMgr.playOneShot('Water_Splash_Big');
        // to do
        // 播放 BossIngame 動畫
        // 1. 對 charAnims[0] 播放 'BossIngame' 動畫, 結束時將 this.using 設為 true, 並呼叫 playIdle()
        console.log(`to do: 請播放 BossIngame 動畫`);
        playAnime(charAnims[0], 'BossIngame', wrapMode.Normal, ()=>{
            this.using = true;
            this.playIdle();
        });

        // #region 實作時請把這段代碼移除
        //delay(this.node, 1, () => { this.using = true; this.playIdle(); });    // 替代 BossIngame
        // #endregion 實作時請把這段代碼移除

        // 炸飛所有場景上的怪物
        delay(this.node, .333, () => {
            // to do
            // 炸飛所有場景上的怪物
            // 1. 先使用 Game.monsterMgr.getAllEntities() 取得所有怪物, 並過濾掉自己 (this.id)
            // 2. 使用 fxMgr.makeMonsterFly() 來炸飛所有怪物 (中心點為 bipNode.worldPosition)
            // 3. 使用 shake2D() 來震動畫面 1.2 秒, 頻率 25, 力度 10, 阻尼 .97
            // 4. 播放音效 'Giant_Water'
            console.log(`to do: Boss 進場時炸飛所有怪物`);

            const entities = Game.monsterMgr.getAllEntities().filter(ent => ent.getID() !== this.id);
            fxMgr.makeMonsterFly(bipNode.worldPosition, entities);
            shake2D(Game.cam3D.node, 1.2, 25, 10, .97);
            Game.sndMgr.playOneShot('Ginat_Water');

        });

        // to do
        // 切換背景音樂
        console.log(`to do: 切換背景音樂 BGM_Boss`);
        Game.sndMgr.playMusic('BGM_Boss', true);

        // Boss 計時
        delay(this.node, 45, () => {
            const timerNode = instantiate(this.clockTimerUIPrefab);
            timerNode.setParent(Game.node.noticeLayer);
            timerNode.setPosition(0, 270, 0);

            const timerUI = timerNode.getComponent(ClockTimerUI);
            timerUI.startTiming(15, () => this.playDead(), () => timerUI.destroy());
            timerUI.showFadeIn(.5);
        });
    }

    private playIdle() {
        const charAnims = this.monsterAnims;
        if (Math.random() < .6) {
            this.canShowHurt = true;
            playAnime(charAnims[0], 'BossIdle01', wrapMode.Normal, () => {
                this.playIdle();
            });
        }
        else {
            this.canShowHurt = false;
            const clipName = rItem(['BossIdle02', 'BossIdle03']);
            playAnime(charAnims[0], clipName, wrapMode.Normal, () => {
                this.playIdle();
            });

            if (clipName === 'BossIdle02') {
                delay(this.node, .15, () => {
                    shake2D(Game.cam3D.node, 1, 25, 4, .97);
                    Game.sndMgr.playOneShot('Giant_Yell');
                });
            }
            if (clipName === 'BossIdle03') {
                delay(this.node, 1.8, () => {
                    Game.sndMgr.playOneShot('Giant_Head');
                });
            }
        }
    }

    private playDead() {
        this.using = false;
        this.canShowHurt = false;
        this.colliders.forEach(c => c.enabled = false);
        this.stopMove();

        // 先除名, 避免被其它功能重複抓取到
        Game.monsterMgr.removeFromEntitiesMap(this.id);

        Tween.stopAllByTag(this.tagAttack, this.node);
        delay(this.node, 2.8, () => {
            shake2D(Game.cam3D.node, 1, 25, 6, .97);
            Game.sndMgr.playOneShot('Giant_Water');
        });

        const charAnims = this.monsterAnims;
        playAnime(charAnims[0], 'BossDead', wrapMode.Normal, () => {
            // to do
            // 切換背景音樂
            // 使用 Game.getValue<string>('Main_BGM') 來取得主場音樂名稱
            console.log(`to do: 切換背景音樂回主場音樂`);
            const musicName = Game.getValue<string>('Main_BGM');
            Game.sndMgr.playMusic(musicName, true);

            this.sinkAllEntities();
            tween(this.node.children[0])
                .by(.8, { position: v3(0, -150, 0) }, { easing: easeIn(2) })
                .call(() => {
                    this.node.children[0].setPosition(0, 0, 0);
                    this.pushToPool();
                })
                .start();
        });
    }

    /**
     * 清空所有場景上的怪物
     */
    private sinkAllEntities() {
        const fxMgr = Game.effectMgr;
        const waterH = Game.effectMgr.getWaterHeight();
        const wpos = v3();

        Game.monsterMgr.getAllEntities().forEach(ent => {
            if (ent.getID() === this.id)
                return;

            ent.stopMove();
            ent.setUsing(false);
            ent.colliders.forEach(c => c.enabled = false);

            delay(ent.node, .4, () => {
                wpos.set(ent.node.worldPosition); wpos.y = waterH;
                fxMgr.playWaterSplashFx(wpos, 1, false);
            });

            // 直接沉沒並回收
            tween(ent.node.children[0])
                .by(.8, TwUtils.props.position_0_n100_0)
                .call(() => {
                    ent.node.children[0].setPosition(0, 0, 0);
                    ent.pushToPool();
                })
                .start();
        });
    }

    /**
     * 站在板子上的怪物演出被擊退的效果
     */
    showHurt(hits: number) {
        if (!this.using)
            return;

        this.damageTint(true);

        if (!this.canShowHurt)
            return;

        const charAnims = this.monsterAnims;
        const tryNum = Math.min(hits, 3);       // 最多嘗試 3 次
        for (let i = 0; i < tryNum; ++i) {
            if (Math.random() < .15) {
                Game.sndMgr.playOneShot(this.getHurtSndName());
                playAnime(charAnims[0], 'BossHurt', wrapMode.Normal, () => {
                    this.playIdle();
                });
                break;
            }
        }
    }

    showReward(winNum: number): boolean {
        this.using = false;
        this.canShowHurt = false;
        this.colliders.forEach(c => c.enabled = false);

        const charAnims = this.monsterAnims;
        const bipNode = find(charAnims[0], 'Root/Bip001');
        const wpos2D = convert3DPosTo2DPos(Game.cam3D, Game.cam2D, bipNode.worldPosition);
        wpos2D.y += 60;

        // Boss 大金幣
        Game.effectMgr.showBossGetCoins(wpos2D, winNum, () => {
            Game.gameCtrl.addPlayerCoins(winNum);
            Game.uiCtrl.updatePlayerCoins();
        });

        // BossAttack 動畫
        Game.sndMgr.playOneShot(this.getHurtSndName());
        playAnime(charAnims[0], 'BossAttack', wrapMode.Normal, () => {
            this.using = true;
            this.canShowHurt = true;
            this.colliders.forEach(c => c.enabled = true);
            this.playIdle();
        });

        // 攻擊特效
        Tween.stopAllByTag(this.tagAttack, this.node);
        tween(this.node)
            .delay(1.4).call(() => {
                // to do
                // 播放攻擊特效 (attackFxPrefab)
                // 1. 使用 instantiate() 來生成攻擊特效的節點 (attackFxPrefab)
                // 2. 設定攻擊特效的父節點為 Game.node.effect3DLayer
                // 3. 翻轉攻擊特效的縮放 Y 值 (scale.x, -scale.y, scale.z)
                // 4. 播放攻擊特效的動畫 (動畫代空字串表示播放預設動畫), 動畫結束後銷毀自己
                console.log(`to do: 請播放攻擊特效 1`);
                const atkFx = instantiate(this.attackFxPrefab);
                atkFx.setParent(Game.node.effect3DLayer);
                const scale = atkFx.scale;
                atkFx.setScale(scale.x, -scale.y, scale.z);
                playAnime(atkFx, '', wrapMode.Normal, ()=> atkFx.destroy());

                Game.sndMgr.playOneShot('Giant_Attack');    // 這個音效做死了左右兩次攻擊

                delay(this.node, .1, () => {
                    // to do
                    // 播放攻擊特效後, 要擊飛那一側的怪物
                    // 1. 使用 Game.monsterMgr.getAllEntities() 取得所有怪物, 並過濾掉自己 (this.id)
                    // 2. 使用 filter() 來過濾出左側的怪物 (x < 0)
                    // 3. 使用 fxMgr.makeMonsterFly() 來擊飛所有怪物 (中心點為 bipNode.worldPosition)
                    // 4. 使用 shake2D() 來震動畫面 .8 秒, 頻率 25, 力度 5
                    console.log(`to do: 請擊飛左側的怪物`);
                    const entities = Game.monsterMgr.getAllEntities().filter(ent => ent.getID() !== this.id);
                    const leftSide = entities.filter(ent => ent.node.position.x < 0);
                    Game.effectMgr.makeMonsterFly(bipNode.worldPosition, leftSide);
                    shake2D(Game.cam3D.node, .8, 25, 5);

                    delay(Game.gameCtrl.timer, .3, () => {
                        Game.sndMgr.playOneShot('Water_Splash_Big');
                    });
                });
            })
            .delay(.6).call(() => {
                // to do
                // 播放攻擊特效 (attackFxPrefab)
                // 1. 使用 instantiate() 來生成攻擊特效的節點 (【attackFxPrefab)
                // 2. 設定攻擊特效的父節點為 Game.node.effect3DLayer
                // 3. 這一側不需要翻轉特效
                // 4. 播放攻擊特效的動畫 (動畫代空字串表示播放預設動畫), 動畫結束後銷毀自己
                console.log(`to do: 請播放攻擊特效 2`);
                const atkFx = instantiate(this.attackFxPrefab);
                atkFx.setParent(Game.node.effect3DLayer);
                playAnime(atkFx, '', wrapMode.Normal, ()=> atkFx.destroy());

                delay(this.node, .1, () => {
                    // to do
                    // 播放攻擊特效後, 要擊飛那一側的怪物
                    // 1. 使用 Game.monsterMgr.getAllEntities() 取得所有怪物, 並過濾掉自己 (this.id)
                    // 2. 使用 filter() 來過濾出右側的怪物 (x > 0)
                    // 3. 使用 fxMgr.makeMonsterFly() 來擊飛所有怪物 (中心點為 bipNode.worldPosition)
                    // 4. 使用 shake2D() 來震動畫面 .8 秒, 頻率 25, 力度 5
                    console.log(`to do: 請擊飛右側的怪物`);
                    //console.log(`to do: 請擊飛左側的怪物`);
                    const entities = Game.monsterMgr.getAllEntities().filter(ent => ent.getID() !== this.id);
                    const leftSide = entities.filter(ent => ent.node.position.x > 0);
                    Game.effectMgr.makeMonsterFly(bipNode.worldPosition, leftSide);
                    shake2D(Game.cam3D.node, .8, 25, 5);

                    delay(Game.gameCtrl.timer, .3, () => {
                        Game.sndMgr.playOneShot('Water_Splash_Big');
                    });
                });
            })
            .tag(1247)
            .start();

        return true;
    }

    /**
     * 黃金巨人不會被擊殺, 只會腳本時間到達後主動退場
     */
    showDeath() { /* 這裡不實作 */ }

    /**
     * 取得受擊音效名稱
     */
    getHurtSndName(): string {
        // to do
        // 回傳 Boss 的受擊名稱 (Giant_Hurt_01 or Giant_Hurt_02)
        console.log(`to do: 請設定 Boss 的受擊名稱`);
        return `Giant_Hurt_01${rInt(1,2)}`;

        return '';
    }

}
