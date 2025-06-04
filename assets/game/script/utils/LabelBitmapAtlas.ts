import { gfx, ImageAsset, Label, rect, Rect, SpriteFrame, Texture2D } from 'cc';

export class LabelBitmapAtlas {

    texture = null as DynamicAtlasTexture;
    textureBleeding = true;    // 預設要打開, 不然邊緣會吃到其他文字    

    private space = 1;
    private freeRects = [] as Rect[];
    private labelRectCache = new Map<Label, Rect>();
    private isFull = false;

    constructor(width: number, height: number) {
        const texture = new DynamicAtlasTexture();
        texture.initWithSize(width, height);
        this.texture = texture;
        this.freeRects.push(rect(0, 0, width, height));
    }

    insert(label: Label): SpriteFrame | null {
        if (!this.isPackable(label))
            return null;

        const labSprFrame = label.ttfSpriteFrame;
        const labTexture = labSprFrame.texture as Texture2D;
        const atlasTexture = this.texture;
        const sp = this.space;

        const sp2 = sp * 2;
        const { width, height } = labTexture;
        const width2 = width + sp2, height2 = height + sp2;

        // 先檢查圖集尺寸是否容得下 labelTexture
        if (atlasTexture.width < width2)
            return null;
        if (atlasTexture.height < height2)
            return null;

        // 如果 label 已經在 labelRectCache 裡, 並且尺寸足夠就直接複用該空間
        // 否則嘗試找出最佳的空間插入圖片
        let x = 0, y = 0;
        let labRect = this.labelRectCache.get(label);
        if (labRect && (labRect.height >= height2 && labRect.width >= width2)) {
            x = labRect.x + sp, y = labRect.y + sp;
            this.drawImageAt(labTexture.image, x, y);
        }
        else {
            // 檢查自己在不在 labelRectCache 裡, 如果有就先移除
            this.remove(label);

            // 若空間不足了, 重排一次看能不能騰出空間
            const bestIdx = this.getBestRect(width2, height2);
            if (bestIdx === -1) {
                // this.remove 會改變 isFull 的狀態
                if (this.isFull)
                    return null;

                // 重排 labelRectCache 裡的 label
                this.isFull = true;
                this.repack();

                // 重排後再次嘗試插入 label
                const sprFrame = this.insert(label);
                this.isFull = !sprFrame;    // 成功插入後就不再標記為滿了   
                return sprFrame;
            }

            // 將 labelTexture 繪製到 atlasTexture 上
            const bestRect = this.freeRects[bestIdx];
            x = bestRect.x + sp, y = bestRect.y + sp;
            this.drawImageAt(labTexture.image, x, y);

            // 將 bestRect 拆成兩個新的 freeRects
            this.freeRects.splice(bestIdx, 1);
            this.splitIntoFreeRects(bestRect, width2, height2);
            this.labelRectCache.set(label, rect(bestRect.x, bestRect.y, width2, height2));
        }

        const newRect = labSprFrame.rect.clone();
        newRect.x += x;
        newRect.y += y;

        const sprFrame = new SpriteFrame();
        sprFrame.texture = atlasTexture;
        sprFrame.rect = newRect;
        sprFrame.packable = false;
        return sprFrame;
    }

    remove(label: Label) {
        const labRect = this.labelRectCache.get(label);
        if (labRect) {
            this.freeRects.push(labRect);
            this.labelRectCache.delete(label);
            this.isFull = false;
        }
    }

    repack() {
        const { width, height } = this.texture;
        this.freeRects.length = 0;
        this.freeRects.push(rect(0, 0, width, height));

        // 優化: 按文字高度大小排序
        const labels = Array.from(this.labelRectCache.keys())
            .filter(lab => lab.enabledInHierarchy)
            .sort((a, b) => {
                const rectA = a.ttfSpriteFrame.rect;
                const rectB = b.ttfSpriteFrame.rect;
                return rectB.height - rectA.height;
            });

        // 強制重排一次
        this.labelRectCache.clear();
        for (const lab of labels)
            lab.node.emit('update-inner-sprite', true);
    }

    private isPackable(label: Label): boolean {
        // 只有符合這些條件的 Label 才允許放入自定義的圖集
        const isOK = (
            label.ttfSpriteFrame &&
            label.cacheMode === Label.CacheMode.NONE &&
            label.string !== ''
        );
        return isOK;
    }

    private getBestRect(width: number, height: number): number | -1 {
        let bestIdx = -1;
        let bestScore = Number.MAX_VALUE;
        for (let i = 0, len = this.freeRects.length; i < len; ++i) {    // freeRects 數量不大, 直接線性搜尋即可
            const rect = this.freeRects[i];
            if (rect.height < height || rect.width < width)
                continue;

            const score = rect.height - height;    // 文字的情況以高度符合為優先, 排列的效果似乎不錯
            if (score < bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    private splitIntoFreeRects(myRect: Rect, boxW: number, boxH: number) {
        const freeRect1 = rect(myRect.x, myRect.y + boxH, myRect.width, myRect.height - boxH);
        const freeRect2 = rect(myRect.x + boxW, myRect.y, myRect.width - boxW, boxH);
        this.freeRects.push(freeRect1);
        this.freeRects.push(freeRect2);
    }

    private drawImageAt(image: ImageAsset, x: number, y: number) {
        const texture = this.texture;
        if (this.textureBleeding) {
            // Smaller frame is more likely to be affected by linear filter
            const { width, height } = image;
            if (width <= 8 || height <= 8) {
                texture.drawTextureAt(image, x - 1, y - 1);
                texture.drawTextureAt(image, x - 1, y + 1);
                texture.drawTextureAt(image, x + 1, y - 1);
                texture.drawTextureAt(image, x + 1, y + 1);
            }
            texture.drawTextureAt(image, x - 1, y);
            texture.drawTextureAt(image, x + 1, y);
            texture.drawTextureAt(image, x, y - 1);
            texture.drawTextureAt(image, x, y + 1);
        }
        texture.drawTextureAt(image, x, y);
    }

}

export class DynamicAtlasTexture extends Texture2D {

    initWithSize(width: number, height: number, format: number = Texture2D.PixelFormat.RGBA8888) {
        this.reset({ width, height, format });
    }

    drawTextureAt(image: ImageAsset, x: number, y: number) {
        const gfxTexture = this.getGFXTexture();
        if (!image || !gfxTexture)
            return;

        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice)
            return;

        const region = new gfx.BufferTextureCopy();
        region.texOffset.x = x;
        region.texOffset.y = y;
        region.texExtent.width = image.width;
        region.texExtent.height = image.height;
        gfxDevice.copyTexImagesToTexture([image.data as HTMLCanvasElement], gfxTexture, [region]);
    }

}
