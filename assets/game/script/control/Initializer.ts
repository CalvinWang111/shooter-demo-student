import { _decorator, Camera, Component, director, Node } from 'cc';
import { find } from '../utils/Utils';
import { Game } from '../system/Game';

const { ccclass, property } = _decorator;

@ccclass('Initializer')
export class Initializer extends Component {

    onLoad() {
        this.init();
        this.freeOnStageDestroy();    // 確保 Stage 被銷毀的最後一步時, 執行註冊好的釋放函式
    }

    private init() {
        // 設定常用的節點
        const game_node = Game.node;
        game_node.stage = find('Canvas/Stage');
        game_node.display = find(game_node.stage, 'Display');
        game_node.scene = find(game_node.display, 'Scene');
        game_node.ui = find(game_node.display, 'UI');

        // 設定 Scene 裡面的節點
        const scene = game_node.scene;
        game_node.riverLayer = find(scene, 'RiverLayer');
        game_node.waterLayer = find(scene, 'WaterLayer');
        game_node.landLayer = find(scene, 'LandLayer');
        game_node.cannonLayer = find(scene, 'CannonLayer');
        game_node.bulletLayer = find(scene, 'BulletLayer');
        game_node.enemyLayer = find(scene, 'EnemyLayer');
        game_node.effect3DLayer = find(scene, 'EffectLayer');

        // 設定 UI 裡面的節點
        const ui = game_node.ui;
        game_node.touchPanel = find(ui, 'TouchPanel');
        game_node.effect2DLayer = find(ui, 'EffectLayer');
        game_node.playerLayer = find(ui, 'PlayerLayer');
        game_node.buttonLayer = find(ui, 'ButtonLayer');
        game_node.rewardLayer = find(ui, 'RewardLayer');
        game_node.noticeLayer = find(ui, 'NoticeLayer');
        game_node.uiLayer = find(ui, 'UILayer');

        // 設定常用的元件 (沒辦法自己設定自己的元件寫在這裡)
        Game.cam2D = find(game_node.stage, 'Camera/UI Camera', Camera);
        Game.cam3D = find(game_node.stage, 'Camera/3D Camera', Camera);
    }

    private freeOnStageDestroy() {
        // 這裡的作法比較 Tricky
        // 當 Stage 被銷毀時, 臨時新增一個節點, 並監聽該節點的銷毀事件
        // 這樣可以確保該節點的銷毀事件會在所有的元件的 onDestroy 之後執行
        const event_Node_Destroyed = Node.EventType.NODE_DESTROYED;
        Game.node.stage.once(event_Node_Destroyed, () => {
            const latest = new Node('_');
            latest.setParent(Game.node.stage);
            latest.once(event_Node_Destroyed, () => {
                director.emit('__Free__');    // 用來解除引用, 避免時序上的出錯
                this.free();
            });
        });
    }

    private free() {
        // 清空常用的節點引用
        const game_node = Game.node;
        Object.keys(game_node).forEach(key => {
            game_node[key] = null;
        });

        // 清空常用的元件 (由 Initializer 設定的元件寫在這裡)
        Game.cam2D = null;
        Game.cam3D = null;
    }

}
