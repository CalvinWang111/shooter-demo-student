import { _decorator, Component, Node, v3, view } from 'cc';
import { setUISize } from '../utils/Utils';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

/**
 * 在寬螢幕下強制拉伸'場景模型'的寬度
 */
@ccclass('SceneExtent')
export class SceneExtent extends Component {

    private oldScale = v3();

    onLoad() {
        this.oldScale.set(this.node.scale);
    }

    onEnable() {
        this.onResize();
        Game.node.stage.on(Node.EventType.SIZE_CHANGED, this.onResize, this);
    }

    onDisable() {
        Game.node.stage.off(Node.EventType.SIZE_CHANGED, this.onResize, this);
    }

    onResize() {
        const designSize = view.getDesignResolutionSize();
        const uiSize = setUISize(Game.node.stage, -1, -1);
        const oldScale = this.oldScale;

        const rateW = (uiSize.width / designSize.width);
        this.node.setScale(oldScale.x * rateW, oldScale.y, oldScale.z);
    }

}
