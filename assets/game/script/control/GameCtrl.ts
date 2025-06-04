import { _decorator, clamp, Component, EventKeyboard, Input, input, KeyCode, Node, sys, Tween } from 'cc';
import { delay, easeIn, fadeTween, poll, rInt, setOpacity } from '../utils/Utils';
import { Env } from '../utils/Configurations';
import { getHitsByShootMode } from '../cannon/ShootBetRate';
import { RoleTurret } from '../cannon/RoleTurret';
import { BulletData } from '../bullet/BulletData';
import { Monster } from '../monster/Monster';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('GameCtrl')
export class GameCtrl extends Component {

    private isInit = false;
    private playerTurret = null as RoleTurret;

    // 玩家資訊 (單機 Demo 先寫死在這裡)
    private playerCoins = 0;
    private betIndex = 0;
    private betList = [0];

    private walletBuffer = 0;                       // 使用大額子彈時, 尚未使用完的餘額會存在這 (避免吃錢的情況)
    private RTP = .97;                              // Return To Player (返回率)

    onLoad() {
        Game.gameCtrl = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.gameCtrl = null);
        this.playerTurret = this.getComponentInChildren(RoleTurret);

        // 開發測試用
        this.devTestInit();

        // 手機上嘗試全螢幕 (iPhone 不支援 HTML5 標準的全螢幕 API)
        if (sys.isBrowser && sys.isMobile && sys.os !== sys.OS.IOS) {
            poll(this.node, 2.5, () => {
                if (!document.fullscreenElement)
                    document.documentElement.requestFullscreen();
            });
        }
    }

    onDestroy() {
        Tween.stopAllByTarget(this.node);
        Game.shootingMgr.onCancelShootFunc = null;
    }

    start() {
        this.gameInit();
    }

    /**
     * 遊戲初始化
     */
    private gameInit() {
        // 先壓黑畫面, 等待玩家入桌 (這裡是單機 Demo, 直接呼叫 joinTable 函式)
        const maskNode = Game.uiCtrl.blackScreenNode;
        maskNode.active = true;

        // 隔一幀等待其它元件初始化完成
        delay(this.node, 0, () => {
            this.joinTable();

            // 入桌成功, 黑畫面淡出
            this.isInit = true;
            fadeTween(maskNode, .7, 255, 0, easeIn(1.5))
                .call(() => {
                    setOpacity(maskNode, 255);
                    maskNode.active = false;
                })
                .start();
        });
    }

    /**
     * 玩家入桌初始化
     */
    private joinTable() {
        this.betList.length = 0;
        this.betList.push(
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            20, 30, 40, 50, 60, 70, 80, 90, 100
        );

        this.betIndex = 0;
        this.playerCoins = 10000;
        this.playerTurret.showLocationHint(true);
        Game.uiCtrl.setSessionText(rInt(10000, 99999));    // 單機 Demo 給個隨機數就行
        Game.uiCtrl.updatePlayerCoins();
        Game.uiCtrl.updatePlayerBet();

        // 註冊退幣處理的函式
        Game.shootingMgr.onCancelShootFunc = (type: number, bltID: number, bet: number, cost: number) => {
            this.addPlayerCoins(cost);
            Game.uiCtrl.updatePlayerCoins();
        };

        // BGM
        Game.setValue('Main_BGM', 'BGM_01');
        Game.sndMgr.playMusic('BGM_01', true);
    }

    /**
     * 由於是單機 Demo, 所以擊殺的判定寫在這裡
     */
    checkKill(entity: Monster, bltData: Readonly<BulletData>): boolean {
        const prob = (this.RTP / entity.getOdds());
        const nowHits = getHitsByShootMode(bltData.type);

        // 按照該發子彈價值幾次 Hits 去做擊殺判定
        let hitCnt = 0, isKilled = false;
        for (let i = 0; i < nowHits; ++i) {
            hitCnt += 1;
            if (Math.random() < prob) {
                isKilled = true;
                break;
            }
        }

        // 需要將殘餘價值存回到 WalletBuffer 裡面
        if (hitCnt < nowHits) {
            const avgVal = (bltData.cost / nowHits);
            const remains = (nowHits - hitCnt) * avgVal;
            this.walletBuffer += remains;
        }

        // 若未成功擊殺, 額外使用 WalletBuffer 去嘗試擊殺目標 (殘餘價值吐回去給玩家)
        if (!isKilled && this.walletBuffer >= bltData.bet) {
            const bet = bltData.bet;
            const moreHits = Math.floor(this.walletBuffer / bet);
            for (let i = 0; i < moreHits; ++i) {
                this.walletBuffer -= bet;
                if (Math.random() < prob) {
                    isKilled = true;
                    break;
                }
            }
        }
        return isKilled;
    }

    getPlayerTurret(): RoleTurret {
        return this.playerTurret;
    }

    getPlayerBet(): number {
        return this.betList[this.betIndex];
    }

    getPlayerCoins(): number {
        return this.playerCoins;
    }

    addPlayerCoins(num: number): number {
        const sum = Math.max(0, this.playerCoins + num);
        this.playerCoins = sum;
        return sum;
    }

    getBetList(): Readonly<number[]> {
        return this.betList;
    }

    setBetIndex(index: number) {
        const lastIndex = this.betList.length - 1;
        return this.betIndex = clamp(index, 0, lastIndex);
    }

    getBetIndex(): number {
        return this.betIndex;
    }

    isReadyToPlay(): boolean {
        return this.isInit;
    }

    get timer(): Node {
        return this.node;
    }

    // ----------------------------------------------------------------
    // 開發測試用
    // ----------------------------------------------------------------

    private devTestInit() {
        if (!Env.isDevTest)
            return;

        input.on(Input.EventType.KEY_DOWN, this.keyDownTest, this);
        Game.dataMgr.freeOnStageDestroy(() => {
            input.off(Input.EventType.KEY_DOWN, this.keyDownTest, this)
        });
    }

    private keyDownTest(e: EventKeyboard) {
        switch (e.keyCode) {
            // 加速射擊
            case KeyCode.F4: {
                const rate = Game.shootingMgr.getCoolDownRate();
                Game.shootingMgr.setCoolDownRate(rate <= 1 ? 3 : 1);
                break;
            }
            case KeyCode.SPACE: {
                break;
            }
        }
    }

}
