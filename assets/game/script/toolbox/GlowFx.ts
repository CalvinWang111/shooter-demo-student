import { _decorator, Component, Material, MeshRenderer, v2, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GlowFx')
export class GlowFx extends Component {

    // #region Properties
    @property(MeshRenderer)
    meshRenderer: MeshRenderer = null;

    @property
    materialIdx: number = 0;

    @property
    bleaching: number = 0;

    @property
    glowing: number = 0;

    @property(Vec2)
    moving: Vec2 = v2(0, 0);

    @property(Vec2)
    offset: Vec2 = v2(0, 0);

    @property
    tiling: number = 1;
    // #endregion

    private lastBleaching = 0;
    private lastGlowing = 0;
    private material = null as Material;
    private uv = v2();

    start() {
        const { meshRenderer } = this;
        if (meshRenderer) {
            this.material = meshRenderer.getMaterialInstance(this.materialIdx);
        }
        const { material: mtl } = this;
        if (mtl) {
            mtl.setProperty('offset', this.offset, 0);
            mtl.setProperty('tiling', this.tiling, 0);
            this.uv.set(this.offset);
        }

    }

    update(dt: number) {
        const { material: mtl } = this;
        if (!mtl) return;

        const { bleaching, glowing, moving, uv } = this;
        if (this.lastBleaching !== bleaching) {
            mtl.setProperty('bleaching', bleaching, 0);
            this.lastBleaching = bleaching;
        }
        if (this.lastGlowing !== glowing) {
            mtl.setProperty('glowing', glowing, 0);
            this.lastGlowing = glowing;
        }
        // 預設為 0 且未改動過不會有精度問題, 若改動過則表示啟用 uv 流動的效果
        if (moving.x !== 0. || moving.y !== 0.) {
            uv.x = (uv.x + moving.x * dt) % 1;
            uv.y = (uv.y + moving.y * dt) % 1;
            mtl.setProperty('offset', uv, 0);
        }
    }
}
