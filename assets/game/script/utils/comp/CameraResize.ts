import { _decorator, Component, Camera, view, screen, macro, renderer, director } from 'cc';
import { Config } from '../Configurations';

const { ccclass, property } = _decorator;

@ccclass('CameraResize')
export class CameraResize extends Component {

    private camera = null as Camera;
    private hypotenuse = -1;

    /**
     * 更新場景中所有 CameraResize 元件
     */
    static updateScene() {
        director.getScene().getComponentsInChildren(CameraResize)
            .forEach(comp => comp.onResize());
    }

    onLoad() {
        this.camera = this.node.getComponent(Camera);
    }

    onDestroy() {
        this.camera = null;
    }

    onEnable() {
        this.onResize();
        view.on('canvas-resize', this.onResize, this);
    }

    onDisable() {
        view.off('canvas-resize', this.onResize, this);
    }

    onResize() {
        if (this.camera.projection === Camera.ProjectionType.ORTHO)
            this.orthoResize();
        else
            this.perspectiveResize();  // 修正攝影機的 FOV, 讓 3D 場景的寬度比例維持一致
    }

    private orthoResize() {
        const camera = this.camera;
        const winSize = screen.windowSize;
        const screenScale = Config.screen.scale;
        camera.orthoHeight = (winSize.height * screenScale) / view.getScaleY() / 2;
    }

    private perspectiveResize() {
        const camera = this.camera;
        if (this.hypotenuse === -1)
            this.hypotenuse = Math.tan((camera.fov / 2) * macro.RAD);

        const winSize = screen.windowSize;
        const designSize = view.getDesignResolutionSize();
        const aspect = (designSize.width / designSize.height);

        let mag = 1;
        if ((winSize.width / winSize.height) <= aspect) {
            const w = (winSize.width / screen.devicePixelRatio);
            const h = (winSize.height / screen.devicePixelRatio);
            mag = w / (h * aspect);
        }

        const screenScale = Config.screen.scale;
        const newFov = Math.atan(this.hypotenuse / mag) * macro.DEG * 2 * screenScale;
        camera.fovAxis = renderer.scene.CameraFOVAxis.VERTICAL;    // 固定垂直方向比例不變
        camera.fov = newFov;
    }

}
