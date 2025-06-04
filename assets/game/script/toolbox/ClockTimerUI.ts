import { _decorator, Component, Label, lerp, tween } from 'cc';
import { easeIn, fadeTween } from '../utils/Utils';
import { TwUtils } from '../system/GameHelper';

const { ccclass, property } = _decorator;

@ccclass('ClockTimerUI')
export class ClockTimerUI extends Component {

    @property(Label)
    timeText: Label = null;

    private time = 0;

    showFadeIn(dur: number) {
        fadeTween(this.node, dur, 1, 255, easeIn(2))
            .start();
    }

    startTiming(dur: number, timesUpFunc?: Function, endFunc?: Function) {
        tween(this.node)
            .by(dur, TwUtils.props.empty, {
                onUpdate: (_, t) => {
                    this.time = lerp(dur, 0, t);
                    this.timeText.string = `${Math.ceil(this.time)}`;
                }
            })
            .call(() => {
                timesUpFunc?.();
                fadeTween(this.node, .5, -1, 0, easeIn(2))
                    .call(() => endFunc?.())
                    .start();
            })
            .start();
    }

    get now(): number {
        return this.time;
    }

}
