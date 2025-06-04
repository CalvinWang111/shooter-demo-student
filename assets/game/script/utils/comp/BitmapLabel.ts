import { _decorator, CacheMode, Color, Director, director, Label, Node, size, Sprite, UIRenderer, UITransform } from 'cc';
import { DynamicAtlasTexture, LabelBitmapAtlas } from '../LabelBitmapAtlas';
import { EDITOR } from 'cc/env';

const lstAtlasSize = [
    size(1024, 512),
    size(1024, 1024),
    size(1024, 2048),
    size(2048, 2048)
];

let atlasSizeIndex = 0;
let labelBitmapAtlas = null as LabelBitmapAtlas;
if (!EDITOR) {
    const { width, height } = lstAtlasSize[0];
    labelBitmapAtlas = new LabelBitmapAtlas(width, height);
}

/**
 * 取得 LabelBitmapAtlas 動態合圖
 */
export function getLabelBitmapAtlas(): LabelBitmapAtlas {
    return labelBitmapAtlas;
}

/**
 * 重新建立 LabelBitmapAtlas 動態合圖, 並自動重排所有 Label
 */
export function rebuildLabelBitmapAtlas(width: number, height: number) {
    if (labelBitmapAtlas) {
        labelBitmapAtlas.texture.destroy();
        const texture = new DynamicAtlasTexture();
        texture.initWithSize(width, height);
        labelBitmapAtlas.texture = texture;
        labelBitmapAtlas.repack();
    }
}

const { ccclass, property } = _decorator;

@ccclass('BitmapLabel')
export class BitmapLabel extends Label {

    // #region Override Label 元件屬性
    get color(): Readonly<Color> {
        return this.getSuperColor();
    }
    set color(value: Color) {
        this.setSuperColor(value);

        if (!EDITOR)
            this.updateInnerSprite();    // 顏色變更時, 更新內部 Sprite
    }

    get string(): string {
        if (EDITOR)
            return this.getSuperString();

        const str = this.getSuperString();
        return str !== '' ? str : this.innerString;
    }
    set string(value: string) {
        if (EDITOR) {
            this.setSuperString(value);
            return;
        }

        const str = value;
        if (str !== '' && str === this.innerString)
            return;

        this.setSuperString(str);
        if (str !== this.innerString && this.enabledInHierarchy) {
            this.innerString = str;
            this.updateInnerSprite();
        }
    }

    get cacheMode(): number {
        return CacheMode.NONE;                     // BitmapLabel, 強制使用 CacheMode.NONE
    }
    set cacheMode(_: CacheMode) {
        this.setSuperCacheMode(CacheMode.NONE);    // BitmapLabel, 強制使用 CacheMode.NONE
    }
    // #endregion

    /**
     * 內部的 Sprite 節點名
     */
    static readonly innerSpriteName = '__INNER_LABEL_SPRITE__';

    /**
     * 當內部的圖片變更時, 是否發送 bitmap-changed 事件
     */
    enableBitmapChangedEvent = false;

    private innerString = '';

    onLoad() {
        super.onLoad?.();
        this.cacheMode = CacheMode.NONE;
    }

    onEnable() {
        super.onEnable?.();

        if (!EDITOR) {
            const str = this.getSuperString();
            if (str !== this.innerString) {
                this.innerString = str;
                this.updateInnerSprite();
            }
            this.node.on('update-inner-sprite', this.updateInnerSprite, this);
        }
    }

    onDisable() {
        if (!EDITOR) {
            this.node.off('update-inner-sprite', this.updateInnerSprite, this);
            labelBitmapAtlas.remove(this);

            this.clearInnerSprite();
            this.setSuperString(this.innerString);
            this.innerString = '';
        }

        super.onDisable?.();
    }

    private updateInnerSprite(force = false) {
        this.clearInnerSprite();    // 更新前都需要先清空內部的 SpriteFrame

        if (this.innerString === '')
            return;

        const updateSprite = () => {
            const sprFrame = labelBitmapAtlas.insert(this);
            if (sprFrame) {
                // 插入成功, 更新內部 SpriteFrame
                const sprite = this.getInnerSprite()!;
                sprite.spriteFrame = sprFrame;

                // insert 回傳的 sprFrame 一定是新的, 可以直接發送事件
                if (this.enableBitmapChangedEvent)
                    this.node.emit('bitmap-changed', sprite);

                // 清空文字內容, 不渲染 Label 元件
                this.setSuperString('');
            }
            else {
                // 確定圖集已滿, 重新建立更大的圖集, 直到最大尺寸為止
                const index = atlasSizeIndex;
                const lastIndex = lstAtlasSize.length - 1;
                if (index < lastIndex) {
                    const { width, height } = lstAtlasSize[index + 1];
                    atlasSizeIndex += 1;
                    rebuildLabelBitmapAtlas(width, height);
                    updateSprite();
                }
            }
        };

        // 將 Label 文字繪製到自定義圖集上
        if (force)
            updateSprite();
        else
            director.once(Director.EVENT_END_FRAME, updateSprite);    // 等待 Label Texture 生成完成後再更新
    }

    getInnerSprite(): Sprite {
        const name = BitmapLabel.innerSpriteName;
        const sprNode = this.node.getChildByName(name);
        if (sprNode) {
            return sprNode.getComponent(Sprite);
        }
        return this.addInnerSprite();
    }

    private addInnerSprite(): Sprite {
        const node = new Node(BitmapLabel.innerSpriteName);
        const sprUI = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);

        const labUI = this.getComponent(UITransform);
        sprUI.setAnchorPoint(labUI.anchorPoint);
        node.layer = this.node.layer;
        node.setParent(this.node);
        node.setSiblingIndex(0);
        return sprite;
    }

    private clearInnerSprite() {
        const sprite = this.getInnerSprite()!;
        if (sprite.spriteFrame) {
            sprite.spriteFrame.destroy();
            sprite.spriteFrame = null;

            // 清空 spriteFrame, 也算是 bitmap-changed 事件
            if (this.enableBitmapChangedEvent)
                this.node.emit('bitmap-changed', sprite);
        }
    }

    // babel 版本太舊, 在 getter | setter 中無法使用 super.xxx 存取父類別的屬性
    private getSuperProperty(prot: any, key: string): PropertyDescriptor | undefined {
        return Object.getOwnPropertyDescriptor(prot, key);
    }

    private setSuperString(value: string) {
        this.getSuperProperty(Label.prototype, 'string')?.set.call(this, value);
    }

    private getSuperString(): string {
        const super_string = this.getSuperProperty(Label.prototype, 'string');
        if (super_string) return super_string.get.call(this);
        return '';
    }

    private setSuperCacheMode(value: number) {
        this.getSuperProperty(Label.prototype, 'cacheMode')?.set.call(this, value);
    }

    private getSuperColor(): Readonly<Color> {
        const super_color = this.getSuperProperty(UIRenderer.prototype, 'color');
        if (super_color) return super_color.get.call(this);
        return Color.WHITE;
    }

    private setSuperColor(value: Color) {
        this.getSuperProperty(UIRenderer.prototype, 'color')?.set.call(this, value);
    }

}
