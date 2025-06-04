import { _decorator, Component, director, equals, screen, Size, size, UITransform, view } from 'cc';
import { SceneViewResize } from './SceneViewResize';
import { Config } from '../Configurations';

const { ccclass, property } = _decorator;

/**
 * 該元件用來顯示邊框
 * 當視窗長寬比超出指定的比例時會顯示邊框
 */
@ccclass('SceneViewBorder')
export class SceneViewBorder extends Component {

    // #region Properties
    @property(UITransform)
    left: UITransform = null;

    @property(UITransform)
    right: UITransform = null;

    @property(UITransform)
    top: UITransform = null;

    @property(UITransform)
    bottom: UITransform = null;
    // #endregion

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
        const isOverTopBottom = (!isOverLeftRight && !equals(frameRatio, designRatio));

        const sceneViewSize = director.getScene()
            .getComponentInChildren(SceneViewResize).node
            .getComponent(UITransform).contentSize;

        // 先假設寬是長邊, 高是短邊
        const { maxLongSideRate, maxShortSideRate } = Config.screen;
        let minWidth = Math.min(designSize.width, designSize.height) * maxLongSideRate;
        let minHeight = Math.max(designSize.width, designSize.height) * maxShortSideRate;

        // 如果是直版, 長短邊互換
        const isLandscape = designSize.width > designSize.height;
        if (isLandscape === false) {
            [minWidth, minHeight] = [minHeight, minWidth];
        }

        this.closeAllBoarders();

        // 左右超出 DesignResolution 範圍
        if (isOverLeftRight === true) {
            const ss = designSize.height / frameSize.height;
            const newWidth = frameSize.width * ss;
            if (newWidth > minWidth) {
                const borderWidth = (newWidth - minWidth) / 2 + 50;
                this.openLeftRightBoarders(sceneViewSize, borderWidth);
            }
        }

        // 上下超出 DesignResolution 範圍
        if (isOverTopBottom === true) {
            const ss = designSize.width / frameSize.width;
            const newHeight = frameSize.height * ss;
            if (newHeight > minHeight) {
                const borderHeight = (newHeight - minHeight) / 2 + 50;
                this.openTopBottomBoarders(sceneViewSize, borderHeight);
            }
        }
    }

    private openLeftRightBoarders(sceneViewSize: Readonly<Size>, borderWidth: number) {
        const { left, right } = this;
        left.node.active = true;
        right.node.active = true;
        left.node.setPosition(-Math.floor(sceneViewSize.width / 2), left.node.position.y);
        right.node.setPosition(Math.floor(sceneViewSize.width / 2), right.node.position.y);
        left.setContentSize(borderWidth, sceneViewSize.height);
        right.setContentSize(borderWidth, sceneViewSize.height);
    }

    private openTopBottomBoarders(sceneViewSize: Readonly<Size>, borderHeight: number) {
        const { top, bottom } = this;
        top.node.active = true;
        bottom.node.active = true;
        top.node.setPosition(top.node.position.x, Math.floor(sceneViewSize.height / 2));
        bottom.node.setPosition(bottom.node.position.x, -Math.floor(sceneViewSize.height / 2));
        top.setContentSize(sceneViewSize.width, borderHeight);
        bottom.setContentSize(sceneViewSize.width, borderHeight);
    }

    private closeAllBoarders() {
        this.left.node.active = false;
        this.right.node.active = false;
        this.top.node.active = false;
        this.bottom.node.active = false;
    }

}
