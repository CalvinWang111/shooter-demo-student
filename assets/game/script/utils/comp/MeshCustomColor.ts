import { _decorator, Component, MeshRenderer, gfx, v4, clamp, renderer, UIMeshRenderer, error } from 'cc';
import { Env } from '../Configurations';

const tmp_v4 = v4();

const { ccclass, property } = _decorator;

/**
 * 透明度和漂色的控制元件
 * 如果材質有使用 USE INSTANCING 功能, 則需要使用客製化的著色器 (3d-unlit-custom, etc), 
 * 並將 MeshCustomColor 元件上的 useInstancing 屬性打勾
 */
@ccclass('MeshCustomColor')
export class MeshCustomColor extends Component {

    // #region Properties
    @property({ type: [MeshRenderer], tooltip: '放置所需的 MeshRenderer\n(材質需要打開混合模式)' })
    meshRenderers: MeshRenderer[] = [];

    @property({ tooltip: '不透明程度: 0 - 255' })
    get opacity(): number {
        return this._opacity;
    }
    @property
    private _opacity = 255;

    @property({ tooltip: '漂色程度: 0 - 1' })
    get bleach(): number {
        return this._bleach;
    }
    @property
    private _bleach = 0;

    @property({ tooltip: '灰色程度: 0 - 1' })
    get grayScale(): number {
        return this._grayScale;
    }
    @property
    private _grayScale = 0;

    @property({ tooltip: '材質是否勾選 USE INSTANCING (需一致)' })
    useInstancing: boolean = false;

    @property({ tooltip: '是否運行遊戲後自動設定' })
    playOnLoad: boolean = false;
    // #endregion

    private a_custom_color_ctrl = [0, 0, 0, 1];  // RGBA32F

    onLoad() {
        // 開發模式下防呆檢查
        if (Env.isDevTest && this.useInstancing) {
            const is2DMode = this.meshRenderers
                .some(comp => !!comp.node.getComponent(UIMeshRenderer));

            if (is2DMode) {
                error('GPU instancing is not supported in \'UI Render Pipeline\'.');
                debugger;
            }
        }

        // 是否加入場景時自動設定
        if (this.playOnLoad) {
            this.scheduleOnce(() => {
                this.opacity = this._opacity;
                this.bleach = this._bleach;
            });
        }
    }

    /**
     * 不透明程度: 0 - 255
     */
    set opacity(value: number) {
        const meshRenderers = this.meshRenderers;
        const opacity = clamp(Math.floor(value), 0, 255);
        this._opacity = opacity;

        if (this.useInstancing === true) {
            // 設定材質 Instancing 屬性
            this.a_custom_color_ctrl[0] = (255 - opacity) / 255;    // 0 ~ 1
            for (const meshRenderer of meshRenderers)
                meshRenderer.setInstancedAttribute('a_custom_color_ctrl', this.a_custom_color_ctrl);
        }
        else {
            // 設定材質 Uniform 屬性
            for (const meshRenderer of meshRenderers) {
                const materials = meshRenderer.materials;
                for (const mtl of materials) {
                    for (const pass of mtl.passes)
                        this.setOpacity(pass, opacity);
                }
            }
        }
    }

    /**
     * 漂色程度: 0 - 1
     */
    set bleach(value: number) {
        const meshRenderers = this.meshRenderers;
        const bleach = clamp(value, 0, 1);
        this._bleach = bleach;

        if (this.useInstancing === true) {
            // 設定材質 Instancing 屬性
            this.a_custom_color_ctrl[1] = bleach;
            for (const meshRenderer of meshRenderers)
                meshRenderer.setInstancedAttribute('a_custom_color_ctrl', this.a_custom_color_ctrl);
        }
        else {
            // 設定材質 Uniform 屬性
            for (const meshRenderer of meshRenderers) {
                const materials = meshRenderer.materials;
                for (const mtl of materials)
                    this.setBleach(mtl.passes[0], this._bleach);    // 只有第一個 Pass 會使用漂色效果
            }
        }
    }

    /**
     * 灰色程度: 0 - 1
     */
    set grayScale(value: number) {
        const meshRenderers = this.meshRenderers;
        const grayScale = clamp(value, 0, 1);
        this._grayScale = grayScale;

        if (this.useInstancing === true) {
            // 設定材質 Instancing 屬性
            this.a_custom_color_ctrl[2] = grayScale;
            for (const meshRenderer of meshRenderers)
                meshRenderer.setInstancedAttribute('a_custom_color_ctrl', this.a_custom_color_ctrl);
        }
        else {
            // 設定材質 Uniform 屬性
            for (const meshRenderer of meshRenderers) {
                const materials = meshRenderer.materials;
                for (const mtl of materials)
                    this.setGrayScale(mtl.passes[0], this._grayScale);    // 只有第一個 Pass 會使用灰色效果
            }
        }
    }

    private setOpacity(pass: renderer.Pass, opacity: number) {
        const handle = pass.getHandle('mainColor', 0, gfx.Type.FLOAT4);
        if (handle !== 0) {
            const color = pass.getUniform(handle, tmp_v4);
            color.w = (opacity / 255);
            pass.setUniform(handle, color);
        }
    }

    private setBleach(pass: renderer.Pass, t: number) {
        const handle = pass.getHandle('bleachColor', 0, gfx.Type.FLOAT4);
        if (handle !== 0) {
            const color = pass.getUniform(handle, tmp_v4);
            color.w = t;
            pass.setUniform(handle, color);
        }
    }

    private setGrayScale(pass: renderer.Pass, t: number) {
        const handle = pass.getHandle('grayScale', 0, gfx.Type.FLOAT);
        if (handle !== 0) {
            pass.setUniform(handle, t);
        }
    }

}
