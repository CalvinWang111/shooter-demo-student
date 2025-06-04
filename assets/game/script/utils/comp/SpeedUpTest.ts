import { _decorator, Component, EventKeyboard, game, Input, input, KeyCode } from 'cc';
import { Env } from '../Configurations';

const { ccclass, property } = _decorator;

/**
 * 按 F8 鍵可以加速遊戲進行, 預設為 8 倍速
 */
@ccclass('SpeedUpTest')
export class SpeedUpTest extends Component {

    private moreTimes = 0;
    private isSpeedingUp = false;

    onLoad() {
        if (Env.isDevTest)
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        if (Env.isDevTest)
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    lateUpdate(dt: number) {
        if (this.moreTimes <= 0)
            return;
        if (this.isSpeedingUp)
            return;

        this.isSpeedingUp = true;
        for (let i = 0, num = this.moreTimes; i < num; ++i) {
            game.step();
        }
        this.isSpeedingUp = false;
    }

    private onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.F8) {
            const maxTimes = 8;
            this.moreTimes = (this.moreTimes <= 0) ? maxTimes - 1 : 0;
        }
    }

}
