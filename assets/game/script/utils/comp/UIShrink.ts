import { _decorator, clamp01, Component, Node, size, Size, UITransform } from 'cc';

const { ccclass, property, disallowMultiple, executeInEditMode } = _decorator;

@ccclass('UIShrink')
@disallowMultiple(true)
@executeInEditMode(true)
export class UIShrink extends Component {

    // #region Properties
    @property
    private _maxUISize: Size = size(200, -1);

    @property({
        tooltip: '最大內容尺寸 (若寬或高為負值, 則表示不在該方向做尺寸限制)'
    })
    set maxUISize(size: Size) {
        this._maxUISize = size;
        this.shrink();
    }
    get maxUISize(): Size {
        return this._maxUISize;
    }
    // #endregion

    onEnable() {
        this.shrink();
        this.node.on(Node.EventType.SIZE_CHANGED, this.shrink, this);
    }

    onDisable() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.shrink, this);
    }

    /**
     * 更新節點的縮放
     */
    shrink() {
        const { max, min } = Math;
        const { width, height } = this.node.getComponent(UITransform);
        const sx = this._maxUISize.width / max(1, width);
        const sy = this._maxUISize.height / max(1, height);

        // 若寬高都沒有限制, 則不對節點做處理
        if (sx < 0 && sy < 0)
            return;

        // 檢查寬高, 挑選最小的邊當縮放因子
        const s = clamp01(min(
            sx < 0 ? sy : sx,    // 至少有一邊為正數
            sy < 0 ? sx : sy     // 至少有一邊為正數
        ));
        this.node.setScale(s, s);
    }

}
