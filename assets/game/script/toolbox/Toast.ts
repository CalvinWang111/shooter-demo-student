import { _decorator, Component, Label, Node, Tween, Vec3 } from 'cc';
import { delay, easeIn, fadeTween, setOpacity } from '../utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('Toast')
export class Toast extends Component {

    // #region Properties
    @property(Node)
    pivotNode: Node = null;

    @property(Label)
    contentText: Label = null;
    // #endregion

    onLoad() {
        this.pivotNode.active = false;
    }

    show(str: string) {
        this.pivotNode.active = true;
        this.contentText.string = str;

        Tween.stopAllByTarget(this.pivotNode);
        setOpacity(this.pivotNode, 255);

        delay(this.pivotNode, 2, () => {
            fadeTween(this.pivotNode, .5, -1, 0, easeIn(2))
                .call(() => this.pivotNode.active = false)
                .start();
        });
    }

    hide() {
        Tween.stopAllByTarget(this.pivotNode);
        this.pivotNode.active = false;
    }

    setPosition(pos: Readonly<Vec3>) {
        this.pivotNode.setPosition(pos);
    }

    setWorldPosition(wpos2D: Readonly<Vec3>) {
        this.pivotNode.setWorldPosition(wpos2D);
    }

}
