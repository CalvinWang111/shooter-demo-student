import { _decorator, Component, screen, size, UITransform, view } from 'cc';
import { Config } from '../Configurations';

const { ccclass, property, requireComponent } = _decorator;

/**
 * 該元件會根據視窗大小調整自身節點的大小
 * 建議將該元件掛在遊戲場景的根節點上, 其餘 UI 節點使用 Widget 適配畫面即可
 */
@ccclass('SceneViewResize')
@requireComponent(UITransform)
export class SceneViewResize extends Component {

    onEnable() {
        this.onResize();
        view.on('canvas-resize', this.onResize, this);
    }

    onDisable() {
        view.off('canvas-resize', this.onResize, this);
    }

    onResize() {
        const dpr = screen.devicePixelRatio;
        const winSize = screen.windowSize;
        const designSize = view.getDesignResolutionSize();                     // 設計尺寸
        const frameSize = size(winSize.width / dpr, winSize.height / dpr);     // 視窗像素尺寸

        const frameRatio = frameSize.width / frameSize.height;
        const designRatio = designSize.width / designSize.height;
        const isOverLeftRight = (frameRatio > designRatio);
        const isOverTopBottom = (isOverLeftRight === false && frameRatio !== designRatio);

        const { maxLongSideRate, maxShortSideRate } = Config.screen;
        const sceneViewSize = size(designSize);                                // 遊戲場景尺寸
        if (isOverLeftRight === true) {
            const maxWidth = sceneViewSize.height * maxLongSideRate;
            const newWidth = sceneViewSize.height * frameRatio;
            sceneViewSize.width = Math.floor(Math.min(newWidth, maxWidth));
        }
        if (isOverTopBottom === true) {
            const maxHeight = sceneViewSize.width * maxShortSideRate;
            const newHeight = sceneViewSize.width / frameRatio;
            sceneViewSize.height = Math.floor(Math.min(newHeight, maxHeight));
        }

        const uiSize = this.node.getComponent(UITransform);
        uiSize.setContentSize(sceneViewSize);
    }

}
