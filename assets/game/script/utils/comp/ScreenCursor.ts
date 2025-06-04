import { _decorator, Component, EventMouse, Node, sys, UITransform, v2, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScreenCursor')
export class ScreenCursor extends Component {

    @property({ type: Node, tooltip: '鼠標圖示節點' })
    cursorNode: Node = null;

    private loc = v2();
    private isShow = false;    // 是否顯示鼠標

    onEnable() {
        const isShow = (sys.isBrowser && !sys.isMobile);    // 手機上不顯示鼠標
        this.node.active = isShow;
        this.isShow = isShow;

        if (isShow) {
            const resol = view.getDesignResolutionSize();
            const maxDist = Math.max(resol.width, resol.height) * 2;
            this.node.getComponent(UITransform).setContentSize(maxDist, maxDist);
            this.node.on(Node.EventType.MOUSE_MOVE, this.updatePositionByMouse, this);
            document.body.style.cursor = 'none';    // hide the web cursor
        }
    }

    onDisable() {
        if (this.isShow) {
            this.node.off(Node.EventType.MOUSE_MOVE, this.updatePositionByMouse, this);
        }
    }

    private updatePositionByMouse(e: EventMouse) {
        const wpos = e.getUILocation(this.loc);
        this.cursorNode.setWorldPosition(wpos.x, wpos.y, 0);
    }

}
