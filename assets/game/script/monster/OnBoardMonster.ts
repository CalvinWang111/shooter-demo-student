import { _decorator, Animation, AnimationClip, clamp, Label, lerp, Node, tween, Tween, v3 } from 'cc';
import { playAnime } from '../utils/AnimationHelper';
import { delay, find, rInt, rItem } from '../utils/Utils';
import { TwFloating } from '../system/GameHelper';
import { MonsterNo } from './MonsterNo';
import { Monster } from './Monster';
import { Game } from '../system/Game';

const wrapMode = AnimationClip.WrapMode;

const { ccclass, property } = _decorator;

@ccclass('OnBoardMonster')
export class OnBoardMonster extends Monster {

    // #region Properties
    @property({ tooltip: '最大擊退距離' })
    hitBackMaxDist = 40;

    @property({ tooltip: '最大擊退次數' })
    maxHitCnt = 5;

    @property({ type: Label, tooltip: '賠率的文字顯示' })
    oddsText: Label = null;
    // #endregion

    protected hitCnt = 0;
    protected isDown = false;
    protected isRevival = false;
    protected canShowHurt = true;

    // protected monsterNode = null as Node;
    // protected commonAnim = null as Animation;
    // protected boardAnim = null as Animation;

    monsterNode = null as Node;
    commonAnim = null as Animation;
    boardAnim = null as Animation;

    onLoad() {
        super.onLoad();

        const rootNode = find(this.node, 'RootNode');
        this.monsterNode = find(rootNode, 'MonsterNode');
        this.commonAnim = find(rootNode, Animation);
        this.boardAnim = find(this.monsterNode, 'RootNode', Animation);
    }

    postInit() {
        this.using = false;
        this.revival(null, () => this.playIdle());
    }

    pushToPool() {
        this.stopFloating();
        super.pushToPool();
    }

    protected playIdle() {
        const charAnims = this.monsterAnims;
        if (Math.random() < .5) {
            playAnime(charAnims[0], 'idle01');
        }
        else {
            const clipName = rItem(['idle02', 'idle03']);
            playAnime(charAnims[0], clipName, wrapMode.Normal, () => {
                playAnime(charAnims[0], 'idle01');
            });
        }
    }

    /**
     * 復活動畫
     */
    protected revival(onStandFunc?: Function, onInGameEndFunc?: Function) {
        if (this.isRevival)
            return;

        this.using = false;
        this.isDown = true;
        this.isRevival = true;
        this.canShowHurt = false;

        this.hitCnt = 0;
        this.monsterNode.setPosition(0, 0, 0);

        const commAnim = this.commonAnim;
        const charAnims = this.monsterAnims[0];
        charAnims.node.setPosition(0, -5000, 0);

        playAnime(commAnim, 'CommonIdle');
        playAnime(commAnim, 'CommonRevival', null, () => {
            playAnime(charAnims, 'ingame', wrapMode.Normal, () => {
                onInGameEndFunc?.();
            });
            delay(charAnims.node, 0, () => {
                charAnims.node.setPosition(0, 0, 0);
                this.showFloating();
                this.colliders.forEach(c => c.enabled = true);
                this.canShowHurt = true;
                this.isRevival = false;
                this.isDown = false;
                this.using = true;
                onStandFunc?.();
            });
        });
    }

    /**
     * 水上漂浮動畫
     */
    protected showFloating() {
        this.stopFloating();

        const rootNode = this.commonAnim.node;
        tween(rootNode)
            .to(2, TwFloating.props.positions[0])
            .to(2, TwFloating.props.positions[1])
            .to(2, TwFloating.props.positions[2])
            .to(2, TwFloating.props.positions[3])
            .union().repeatForever().tag(501)
            .start();

        tween(rootNode)
            .to(0, TwFloating.props.angles[0])
            .to(1, TwFloating.props.angles[1])
            .to(4, TwFloating.props.angles[2])
            .to(3, TwFloating.props.angles[3])
            .union().repeatForever().tag(502)
            .start();
    }

    /**
     * 停止水上漂浮動畫
     */
    protected stopFloating() {
        const rootNode = this.commonAnim.node;
        Tween.stopAllByTag(501, rootNode);
        Tween.stopAllByTag(502, rootNode);
    }

    /**
     * 站在板子上的怪物演出被擊退的效果
     */
    showHurt(hits: number) {
        this.showHitBack(hits);
    }

    /**
     * 播放擊退效果
     */
    protected showHitBack(hits: number) {
        if (!this.canShowHurt)
            return;
        if (!this.using)
            return;

        this.hitCnt = clamp(this.hitCnt + hits, 0, this.maxHitCnt);
        this.damageTint(true);

        const { hitCnt, maxHitCnt } = this;
        const { boardAnim, monsterAnims: charAnims } = this;

        // 播放 NearWin 動畫
        const progress = (hitCnt / maxHitCnt);
        if (progress >= 1) {
            // to do
            // 實作 NearWin 動畫
            // 1. 設定 this.monsterNode 的位置為 (0, 0, -this.hitBackMaxDist) (z 軸負值)
            // 2. 播放板子 (boardAnim) 後傾動畫 (BoardDown), 播完之後呼叫 this.playIdle() 回到 Idle 動畫
            // 3. 播放怪物 (charAnims[0]) 失衡動畫 (up01), 播完之後接著播放失衡動畫 (up02) Loop
            console.log(`to do: 請在這裡實作 NearWin 動畫`);

            this.monsterNode.setPosition(0, 0, -this.hitBackMaxDist);
            playAnime(boardAnim, 'BoardDown', wrapMode.Normal, () =>{
                this.playIdle();
            });
            playAnime(charAnims[0], 'up01', wrapMode.Normal, () => {
                playAnime(charAnims[0], 'up02', wrapMode.Loop);
            });

            if (Math.random() < .5) {
                Game.sndMgr.playOneShot(this.getHurtSndName());
            }
            return;
        }

        // 擊退效果
        // to do
        // 1. 請使用 lerp 函數計算出目前的擊退距離 0 ~ hitBackMaxDist by progress
        // 2. 設定 this.monsterNode 的位置為 (0, 0, -dist) (z 軸負值)
        console.log(`to do: 請在這裡實作擊退效果`);
        const dist = lerp(0, this.hitBackMaxDist, progress);
        this.monsterNode.setPosition(0, 0, -dist);

        const hitClipName = Math.random() > .3 ? 'hit' : 'super_hit';
        // 播放受擊搖晃動畫
        // to do
        // 1. 播放板子 (boardAnim) 搖晃動畫 (BoardShake)
        // 2. 播放怪物 (charAnims[0]) 受擊動畫 (hitClipName), 播完之後呼叫 this.playIdle() 回到 Idle 動畫
        console.log(`to do: 請在這裡播放受擊搖晃動畫和怪物受擊動畫`);

        playAnime(boardAnim, 'BoardShake', wrapMode.Normal);
        playAnime(charAnims[0], hitClipName, wrapMode.Normal, ()=>{
            this.playIdle();
        });
        if (Math.random() < .5) {
            Game.sndMgr.playOneShot(this.getHurtSndName());
        }
    }

    /**
     * 播放給獎效果
     */
    showReward(winNum: number): boolean {
        this.using = false;
        this.canShowHurt = false;
        this.colliders.forEach(c => c.enabled = false);

        const fxMgr = Game.effectMgr;
        const waterH = fxMgr.getWaterHeight();
        const coinUIPos = Game.uiCtrl.getPlayerCoinUIWpos3D();

        // 避免金幣掉在怪物身體裡
        const startPos = v3(this.node.worldPosition);
        startPos.y = waterH; startPos.z += 40;
        fxMgr.showGetCoins(startPos, coinUIPos, winNum, () => {
            Game.gameCtrl.addPlayerCoins(winNum);
            Game.uiCtrl.updatePlayerCoins();
        });

        return true;
    }

    /**
     * 播放死亡效果
     */
    showDeath() {
        this.using = false;
        this.isDown = true;
        this.canShowHurt = false;

        // to do
        // 播放怪物被擊飛的動畫
        // 1. 停止怪物的浮島漂浮效果 (this.stopFloating())
        // 2. 對板子 (this.boardAnim) 播放 BoardIdle 動畫
        // 3. 對怪物站立點 (this.commonAnim) 播放 CommonDead 動畫
        // 4. 播放受擊音效 (Game.sndMgr.playOneShot(this.getHurtSndName()))

        // 1. 停止浮島漂浮效果
        this.stopFloating();

        // 2. 播放板子的動畫：BoardIdle（無需等待）
        playAnime(this.boardAnim, 'BoardIdle', wrapMode.Normal);

        // 3. 播放怪物本體的死亡動畫：CommonDead（可選 callback）
        playAnime(this.commonAnim, 'CommonDead', wrapMode.Normal, () => {
            // 死亡動畫結束後可選擇做其他事情
            // 例如：移除節點、隱藏特效等
            console.log('怪物死亡動畫播放完畢');
        });

        // 4. 播放受擊音效
        Game.sndMgr.playOneShot(this.getHurtSndName());
            
        

        console.log(`to do: 請在這裡實作怪物死亡效果`);

        const fxMgr = Game.effectMgr;
        const waterH = Game.effectMgr.getWaterHeight();

        const myNode = this.node;
        const charAnims = this.monsterAnims;
        const colliders = this.colliders;

        // 回收時會主動清除 Monster 節點上的定時器
        delay(myNode, .73, () => {
            const wpos = v3();
            const scale = colliders[0].size.x / 55;
            // to do
            // 播放水花特效
            // 1. 設定 wpos 為 charAnims[0] 節點的世界座標, 並將 y 值設為 waterH
            // 2. 使用 fxMgr.playWaterSplashFx() 播放水花特效
            console.log(`to do: 請在這裡實作怪物落水的水花特效`);
            charAnims[0].node.getWorldPosition(wpos);
            wpos.y = waterH;
            fxMgr.playWaterSplashFx(wpos, scale, true);
        });
        delay(myNode, 1, () => {
            // to do
            // 播放水花特效
            // 1. 設定 wpos 為 myNode 節點的世界座標, 並將 y 值設為 waterH
            // 2. 使用 fxMgr.playWaterSplashFx() 播放水花特效, scale 為 1, 不濺水出來
            console.log(`to do: 請在這裡實作浮島下沉的水花特效`);

            const wpos = myNode.getWorldPosition(v3());
            wpos.y = waterH;
            fxMgr.playWaterSplashFx(wpos,1,false);
        });
        delay(myNode, 3, () => {
            this.revival(null, () => this.playIdle());
        });
    }

    /**
     * 取得受擊音效名稱
     */
    getHurtSndName(): string {
        switch (this.no) {
            // 列出有浮島的怪物
            case MonsterNo.Archer:
            case MonsterNo.BombGoblin:
                return `Monster_Hurt_0${rInt(1, 5)}`;

            case MonsterNo.Viking:
            case MonsterNo.Soldier:
            case MonsterNo.Knight:
                return `Male_Hurt_0${rInt(1, 4)}`;

            case MonsterNo.Medusa:
                return `Female_Hurt_0${rInt(1, 2)}`;
        }
        return '';
    }

}
