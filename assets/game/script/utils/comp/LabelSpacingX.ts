import { _decorator, Component, Label } from 'cc';

const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

@ccclass('LabelSpacingX')
@requireComponent(Label)
@executeInEditMode
export class LabelSpacingX extends Component {

    @property
    _spacingX = 0;

    @property
    get spacingX(): number {
        return this._spacingX;
    }
    set spacingX(x: number) {
        this._spacingX = x;
        this.resetSpacingX();
    }

    onEnable() {
        this.resetSpacingX();
    }

    private resetSpacingX() {
        const lab = this.node.getComponent(Label);
        if (lab && lab.cacheMode === Label.CacheMode.CHAR) {
            lab.spacingX = this._spacingX;
        }
    }

}
