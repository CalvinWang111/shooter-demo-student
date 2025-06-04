import { Camera, Node } from 'cc';
import { DataMgr } from '../control/DataMgr';
import { GameCtrl } from '../control/GameCtrl';
import { MonsterMgr } from '../control/MonsterMgr';
import { ShootingMgr } from '../control/ShootingMgr';
import { EffectMgr } from '../control/EffectMgr';
import { SoundMgr } from '../control/SoundMgr';
import { UICtrl } from '../control/UICtrl';

export const Game = {
    // 攝影機
    cam2D: null as Camera,
    cam3D: null as Camera,

    // 常用元件
    dataMgr: null as DataMgr,
    gameCtrl: null as GameCtrl,
    monsterMgr: null as MonsterMgr,
    shootingMgr: null as ShootingMgr,
    effectMgr: null as EffectMgr,
    sndMgr: null as SoundMgr,
    uiCtrl: null as UICtrl,

    // 常用節點
    node: {
        stage: null as Node,
        display: null as Node,
        scene: null as Node,
        ui: null as Node,

        // Scene
        riverLayer: null as Node,
        waterLayer: null as Node,
        landLayer: null as Node,
        cannonLayer: null as Node,
        bulletLayer: null as Node,
        enemyLayer: null as Node,
        effect3DLayer: null as Node,

        // UI
        touchPanel: null as Node,
        effect2DLayer: null as Node,
        playerLayer: null as Node,
        buttonLayer: null as Node,
        rewardLayer: null as Node,
        noticeLayer: null as Node,
        uiLayer: null as Node,
    },

    // 用來存放遊戲運行時的資料
    _env: new Map<string, any>(),
    setValue: function <T>(key: string, value: T) {
        this._env.set(key, value);
    },
    getValue: function <T>(key: string): T | null {
        const value = this._env.get(key);
        if (value === undefined) {
            return null;
        }
        return value as unknown as T;
    }

};
