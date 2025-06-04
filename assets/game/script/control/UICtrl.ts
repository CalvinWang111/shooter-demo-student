import { _decorator, Button, Component, Label, math, Node, Tween, v3, Vec3 } from 'cc';
import { ShootBetRate } from '../cannon/ShootBetRate';
import { ShootMode } from '../cannon/ShootMode';
import { poll, toBankNum } from '../utils/Utils';
import { Toast } from '../toolbox/Toast';
import { Game } from '../system/Game';

const FuncBtnUI = {
    Hammer: 0, Axe: 1, Aim: 2, Auto: 3
};

const { ccclass, property } = _decorator;

@ccclass('UICtrl')
export class UICtrl extends Component {

    // #region Properties
    @property({ type: Node, tooltip: '炮台位置提示' })
    locationHintNode: Node = null;

    @property({ type: Label, tooltip: '遊戲局號文字' })
    sessionText: Label = null;

    @property({ type: Label, tooltip: '玩家的押注額文字' })
    playerBetText: Label = null;

    @property({ type: Label, tooltip: '玩家的剩餘財產文字' })
    playerCoinsText: Label = null;

    @property({ type: Button, tooltip: '押注額調整按鈕' })
    minusBetBtn: Button = null;

    @property({ type: Button, tooltip: '押注額調整按鈕' })
    plusBetBtn: Button = null;

    @property({ type: [Button], tooltip: '遊戲功能按鈕' })
    lstFuncBtn: Button[] = [];

    @property({ type: [Node], tooltip: '遊戲功能按鈕的啟用效果' })
    lstFuncBtnFx: Node[] = [];

    @property({ type: [Node], tooltip: '遊戲功能按鈕的使用花費介面' })
    lstFuncBtnCost: Node[] = [];

    @property({ type: [Node], tooltip: '遊戲功能按鈕的文字節點' })
    lstFuncBtnName: Node[] = [];

    @property({ type: Node, tooltip: '全畫面的黑色遮罩' })
    blackScreenNode: Node = null;

    @property({ type: Toast, tooltip: 'Toast 文字框' })
    toast: Toast = null;
    // #endregion

    private minusBetTween = null as Tween<Node>;
    private plusBetTween = null as Tween<Node>;

    // 3D 金幣飛到的最終位置 (UI 金額位置)
    private coinUIWpos3D = v3(320, 320, 700);    // Hard Coding: 該位置不會發生變化

    onLoad() {
        Game.uiCtrl = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.uiCtrl = null);
    }

    onDestroy() {
        this.minusBetTween?.stop();
        this.plusBetTween?.stop();
        this.minusBetTween = null;
        this.plusBetTween = null;
    }

    start() {
        this.init();
    }

    /**
     * UI 初始化
     */
    private init() {
        // 押注按紐設定
        const event_Touch_Start = Node.EventType.TOUCH_START;
        const event_Touch_End = Node.EventType.TOUCH_END;
        const event_Touch_Cancel = Node.EventType.TOUCH_CANCEL;
        this.minusBetBtn.node.on(event_Touch_Start, this.minusBetBtnOnClick, this);
        this.plusBetBtn.node.on(event_Touch_Start, this.plusBetBtnOnClick, this);
        this.minusBetBtn.node.on(event_Touch_End, this.minusBetBtnOnClickEnd, this);
        this.plusBetBtn.node.on(event_Touch_End, this.plusBetBtnOnClickEnd, this);
        this.minusBetBtn.node.on(event_Touch_Cancel, this.minusBetBtnOnClickEnd, this);
        this.plusBetBtn.node.on(event_Touch_Cancel, this.plusBetBtnOnClickEnd, this);

        // 功能按紐設定
        const event_Click = Button.EventType.CLICK;
        this.lstFuncBtn[FuncBtnUI.Axe].node.on(event_Click, this.axeBtnOnClick, this);
        this.lstFuncBtn[FuncBtnUI.Aim].node.on(event_Click, this.aimBtnOnClick, this);
    }

    setSessionText(seed: number) {
        const nums = [] as string[];
        const digits = '0123456789';
        for (let i = 0; i < 18; ++i) {
            nums.push(digits.charAt(math.pseudoRandomRangeInt(seed, 0, 10)));
            seed = math.pseudoRandomRangeInt(seed, 1000, 9999)
        }
        this.sessionText.string = nums.join('');
    }

    updatePlayerBet() {
        const betNum = Game.gameCtrl.getPlayerBet();
        const betStr = toBankNum(betNum);
        this.playerBetText.string = betStr;

        // 也要刷新其它和押注額有關的 UI (功能按鈕之類)
        this.updateBetBtnStates();
        this.updateFuncBtnCosts();
    }

    updatePlayerCoins() {
        const coinNum = Game.gameCtrl.getPlayerCoins();
        const coinStr = toBankNum(coinNum);
        this.playerCoinsText.string = coinStr;
    }

    getPlayerCoinUIWpos3D(): Readonly<Vec3> {
        return this.coinUIWpos3D;
    }

    private updateBetBtnStates() {
        const { gameCtrl } = Game;
        const betList = gameCtrl.getBetList();
        const betIndex = gameCtrl.getBetIndex();

        let switches = 0b1100;
        if (betIndex === 0) switches = 0b0110;
        else if (betIndex === betList.length - 1) switches = 0b1001;

        this.minusBetBtn.interactable = !!(switches & (1 << 3));
        this.plusBetBtn.interactable = !!(switches & (1 << 2));
        this.minusBetBtn.node.children[0].active = !!(switches & (1 << 1));
        this.plusBetBtn.node.children[0].active = !!(switches & (1 << 0));
    }

    private updateFuncBtnCosts() {
        const betNum = Game.gameCtrl.getPlayerBet();
        this.updateFuncBtnCost(FuncBtnUI.Axe, betNum * ShootBetRate.Axe);
    }

    private updateFuncBtnCost(funcBtnUI: number, cost: number) {
        const uiNode = this.lstFuncBtnCost[funcBtnUI].children[0];
        if (uiNode && uiNode.name === 'Cost') {
            const costText = uiNode.getComponentInChildren(Label);
            if (costText) costText.string = toBankNum(cost);
        }
    }

    private changePlayerBet(indexOffset: number): boolean {
        const { gameCtrl } = Game;
        const currIndex = gameCtrl.getBetIndex();
        gameCtrl.setBetIndex(currIndex + indexOffset);

        const newIndex = gameCtrl.getBetIndex();
        if (newIndex !== currIndex) {
            this.updatePlayerBet();
            return true;
        }
        return false;
    }

    private minusBetBtnOnClick() {
        if (this.changePlayerBet(-1))
            Game.sndMgr.playOneShot('Switch');

        if (!this.minusBetTween && !this.plusBetTween) {    // 防多點觸控
            let threshold = .333;
            this.minusBetTween = poll(this.node, .15, () => {
                if (threshold <= 0) { this.minusBetBtnOnClick(); return; }
                threshold -= .15;
            });
        }
    }

    private plusBetBtnOnClick() {
        if (this.changePlayerBet(1))
            Game.sndMgr.playOneShot('Switch');

        if (!this.minusBetTween && !this.plusBetTween) {    // 防多點觸控
            let threshold = .333;
            this.plusBetTween = poll(this.node, .15, () => {
                if (threshold <= 0) { this.plusBetBtnOnClick(); return; }
                threshold -= .15;
            });
        }
    }

    private minusBetBtnOnClickEnd() {
        this.minusBetTween?.stop();
        this.minusBetTween = null;
    }

    private plusBetBtnOnClickEnd() {
        this.plusBetTween?.stop();
        this.plusBetTween = null;
    }

    private setAxeBtnUIEnable(toggle: boolean) {
        const btn_Axe = FuncBtnUI.Axe;
        this.lstFuncBtnFx[btn_Axe].children[0]!.active = toggle;
        this.lstFuncBtnCost[btn_Axe].children[0]!.active = toggle;
        this.lstFuncBtnName[btn_Axe].children[0]!.active = !toggle;
    }

    private setAimBtnUIEnable(toggle: boolean) {
        const btn_Aim = FuncBtnUI.Aim;
        this.lstFuncBtnFx[btn_Aim].children[0]!.active = toggle;
    }

    private axeBtnOnClick() {
        const btn_Axe = FuncBtnUI.Axe;
        const fxNode = this.lstFuncBtnFx[btn_Axe].children[0]!;
        const enable = !fxNode.active;    // 當前狀態取反

        this.setAxeBtnUIEnable(enable);
        Game.sndMgr.playOneShot('Switch');

        // 設定射擊狀態
        const { shootingMgr } = Game;
        const oldMode = shootingMgr.shootMode;
        shootingMgr.shootMode = enable ? ShootMode.Axe : ShootMode.Normal;

        const isAiming = shootingMgr.isAiming;
        if (isAiming && !enable) shootingMgr.shootMode = ShootMode.Normal_Aim;

        // 切換炮台功能
        if (oldMode !== shootingMgr.shootMode)
            Game.gameCtrl.getPlayerTurret().cannon.equip();
    }

    private aimBtnOnClick() {
        const btn_Aim = FuncBtnUI.Aim;
        const fxNode = this.lstFuncBtnFx[btn_Aim].children[0]!;
        const enable = !fxNode.active;    // 當前狀態取反

        this.setAimBtnUIEnable(enable);
        Game.sndMgr.playOneShot('Switch');

        // 設定射擊狀態
        const { shootingMgr } = Game;
        shootingMgr.isAiming = enable;
        shootingMgr.aimReset();          // 重置瞄準狀態

        const oldMode = shootingMgr.shootMode;
        if (oldMode === ShootMode.Normal) shootingMgr.shootMode = ShootMode.Normal_Aim;
        if (oldMode === ShootMode.Normal_Aim) shootingMgr.shootMode = ShootMode.Normal;

        // 切換炮台功能
        if (oldMode !== shootingMgr.shootMode)
            Game.gameCtrl.getPlayerTurret().cannon.equip();
    }

}
