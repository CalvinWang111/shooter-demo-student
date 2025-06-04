import { _decorator, AnimationClip, Component, game, instantiate, Label, lerp, math, Node, Tween, tween, v3, Vec3 } from 'cc';
import { delay, easeIn, easeInOut, fadeTween, find, perFrame, repeat, rInt, toBankNum } from '../utils/Utils';
import { MeshCustomColor } from '../utils/comp/MeshCustomColor';
import { convert3DPosTo2DPos } from '../utils/Coordinate';
import { playAnime } from '../utils/AnimationHelper';
import { Monster } from '../monster/Monster';
import { TwUtils } from '../system/GameHelper';
import { Game } from '../system/Game';

const wrapMode = AnimationClip.WrapMode;
const tmp_v3 = v3();

const { ccclass, property } = _decorator;

@ccclass('EffectMgr')
export class EffectMgr extends Component {

    onLoad() {
        Game.effectMgr = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.effectMgr = null);
    }

    /**
     * Boss 來襲特效
     */
    showBossComing(odds: number, endFunc?: Function) {
        const bossComing = instantiate(Game.dataMgr.res.bossComingPrefab);
        bossComing.setParent(Game.node.noticeLayer);
        find(bossComing, 'Node_1/bar/OddsNum', Label).string = toBankNum(odds);

        Game.sndMgr.playOneShot('Boss_Coming');
        playAnime(bossComing, '', null, () => {
            bossComing.destroy();
            endFunc?.();
        });
    }

    /**
     * 噴金幣效果
     */
    showGetCoins(dropWpos3D: Readonly<Vec3>, endWpos3D: Readonly<Vec3>, winNum: number, endFunc?: Function) {
        const dataMgr = Game.dataMgr;
        const layerNode = Game.node.effect3DLayer;

        const range = math.randomRange;
        const easeInOut_2 = easeInOut(2);
        const opt_easeIn_2 = TwUtils.opts.easeIn_2;
        const opt_easeOut_2 = TwUtils.opts.easeOut_2;
        const prop_pos_0_0_0 = { position: v3(0, 0, 0) };
        const prop_pos_0_20_0 = { position: v3(0, 20, 0) };

        const speed = 1500;
        const distance = Vec3.distance(dropWpos3D, endWpos3D);
        const collectTime = (distance / speed);

        // 生成 3D 金幣
        const count = rInt(4, 7);
        for (let k = 1; k <= count; ++k) {
            const coinNode = dataMgr.getSmallCoinNode();
            coinNode.setParent(layerNode);
            coinNode.setWorldPosition(
                dropWpos3D.x + range(-50, 50), dropWpos3D.y,
                dropWpos3D.z + range(-50, 50)
            );

            // 金幣先隱藏起來
            const mdlNode = coinNode.children[0];
            mdlNode.setPosition(0, -1000, 0);

            // 彈出效果
            const h1 = range(200, 320);
            const h2 = range(70, 120);
            tween(mdlNode)
                .delay(range(0, .3)).set(prop_pos_0_0_0)
                .to(range(25, 40) * .01, { position: v3(0, h1, 0) }, opt_easeOut_2)
                .to(range(20, 30) * .01, prop_pos_0_0_0, opt_easeIn_2)
                .to(range(20, 30) * .01, { position: v3(0, h2, 0) }, opt_easeOut_2)
                .to(range(20, 30) * .01, prop_pos_0_0_0, opt_easeIn_2)
                .to(.1, prop_pos_0_20_0, opt_easeOut_2)
                .to(.1, prop_pos_0_0_0, opt_easeIn_2)
                .start();


            // 收回 UI 金額位置
            const lastOne = (k === count);
            const sp = v3(coinNode.worldPosition), ep = endWpos3D;
            tween(coinNode)
                .delay(2).by(collectTime, TwUtils.props.empty, {
                    onUpdate: (_, t) => {
                        const k = easeInOut_2(t);
                        mdlNode.setWorldPosition(
                            lerp(sp.x, ep.x, k), lerp(sp.y, ep.y, k), lerp(sp.z, ep.z, k)
                        );
                    }
                })
                .call(() => {
                    mdlNode.setPosition(0, 0, 0);
                    Tween.stopAllByTarget(mdlNode);
                    dataMgr.putToSmallCoinPool(coinNode);
                    if (lastOne) {
                        const sndTimes = Math.min(5, rInt(1, count));    // 最多不超過 5 次
                        repeat(Game.gameCtrl.timer, .08, sndTimes, () => {
                            Game.sndMgr.playOneShot('Collect_01');
                        });
                        endFunc?.();
                    }
                })
                .start();
        }

        // 顯示金額數字 (大於 0 才顯示)
        if (winNum > 0) {
            const wpos2D = convert3DPosTo2DPos(
                Game.cam3D, Game.cam2D,
                dropWpos3D, tmp_v3
            );
            wpos2D.x += 40; wpos2D.y -= 40
            this.showWinNum(wpos2D, winNum);
        }
    }

    /**
     * Boss 噴金幣效果
     */
    showBossGetCoins(dropWpos2D: Readonly<Vec3>, winNum: number, endFunc?: Function) {
        const dataMgr = Game.dataMgr;
        const layerNode = Game.node.effect2DLayer;

        const coinNode = dataMgr.getBossCoinNode();
        coinNode.setParent(layerNode);
        coinNode.setWorldPosition(dropWpos2D);

        Game.sndMgr.playOneShot('Collect_02');

        playAnime(coinNode, '', wrapMode.Normal, () => {
            dataMgr.putToBossCoinPool(coinNode);
            endFunc?.();
        });

        // 顯示金額數字 (大於 0 才顯示)
        if (winNum > 0) {
            const wpos2D = tmp_v3.set(dropWpos2D);
            wpos2D.x += 80; wpos2D.y -= 80
            this.showWinNum(wpos2D, winNum);
        }
    }

    /**
     * 顯示金額數字
     */
    showWinNum(wpos2D: Readonly<Vec3>, winNum: number) {
        if (winNum <= 0)
            return;

        const dataMgr = Game.dataMgr;
        const layerNode = Game.node.rewardLayer;
        const coinNumNode = dataMgr.getWinNumNode();

        coinNumNode.setParent(layerNode);
        coinNumNode.setWorldPosition(wpos2D);

        const coinText = coinNumNode.getComponentInChildren(Label);
        coinText.string = `+${toBankNum(winNum)}`;

        fadeTween(coinNumNode, .2, 1, 255, easeIn(1.5))
            .start();

        tween(coinNumNode)
            .by(.9, { position: v3(0, math.randomRange(70, 110), 0) }, TwUtils.opts.easeOut_2)
            .delay(.5).call(() => {
                fadeTween(coinNumNode, .4, -1, 0, easeIn(1.5))
                    .call(() => {
                        Tween.stopAllByTarget(coinNumNode);
                        dataMgr.putToWinNumPool(coinNumNode);
                    })
                    .start();
            })
            .start();
    }

    /**
     * 顯示未命中的文字
     */
    showMissText(wpos2D: Readonly<Vec3>) {
        const dataMgr = Game.dataMgr;
        const layerNode = Game.node.rewardLayer;
        const missTextNode = dataMgr.getMissTextNode();

        missTextNode.setParent(layerNode);
        missTextNode.setWorldPosition(wpos2D);

        fadeTween(missTextNode, .2, 1, 255, easeIn(1.5))
            .start();

        tween(missTextNode)
            .by(.6, { position: v3(0, math.randomRange(50, 90), 0) }, TwUtils.opts.easeOut_2)
            .delay(.3).call(() => {
                fadeTween(missTextNode, .3, -1, 0, easeIn(1.5))
                    .call(() => {
                        Tween.stopAllByTarget(missTextNode);
                        dataMgr.putToMissTextPool(missTextNode);
                    })
                    .start();
            })
            .start();
    }

    /**
     * 怪物落水特效
     */
    playWaterSplashFx(wpos3D: Readonly<Vec3>, scale: number, hasSplash: boolean = true) {
        const dataMgr = Game.dataMgr;
        const layerNode = Game.node.waterLayer;

        const fxNode = new Node('WaterSplashFx');
        fxNode.setParent(layerNode);
        fxNode.setWorldPosition(wpos3D);
        fxNode.setScale(scale, scale, scale);

        const range = math.randomRange;
        repeat(fxNode, .1, 4, () => {
            const speed = range(1, 1.5);
            const ripple = dataMgr.getWaterRippleNode();
            ripple.setParent(fxNode);
            ripple.setPosition(range(-10, 10), 0, range(-10, 10));
            ripple.setScale(range(1, 1.2), 1, range(1, 1.2));
            ripple.setRotationFromEuler(0, range(0, 360), 0);

            const rot = range(20, 45) * (Math.random() > .5 ? 1 : -1);
            tween(ripple)
                .by(.8, { eulerAngles: v3(0, rot, 0) })
                .start();
            tween(ripple.getComponent(MeshCustomColor))
                .set(TwUtils.props.opacity_255)
                .delay(.35 / speed).to(1.5 / speed, TwUtils.props.opacity_0)
                .start();
            tween(ripple)
                .to(2 / speed, { scale: v3(ripple.scale).multiplyScalar(2) })
                .call(() => {
                    Tween.stopAllByTarget(ripple);
                    dataMgr.putToWaterRipplePool(ripple);
                })
                .start();
        });

        if (hasSplash) {
            Game.sndMgr.playOneShot('Water_Splash_Small');

            let k = 0;
            repeat(fxNode, .0333, 4, () => {
                const speed = range(1, 1.5);
                const splash = dataMgr.getWaterSplashNode();
                splash.setParent(fxNode);

                const index = math.randomRangeInt(0, splash.children.length);
                splash.children.forEach((node, i) => node.active = (i === index));

                switch (k++) {
                    case 0: splash.setPosition(range(-10, 0), 0, range(0, 10)); break;
                    case 1: splash.setPosition(range(0, 10), 0, range(0, 10)); break;
                    case 2: splash.setPosition(range(-10, 0), 0, range(-10, 0)); break;
                    case 3: splash.setPosition(range(0, 10), 0, range(-10, 0)); break;
                }

                tween(splash.getComponent(MeshCustomColor))
                    .set(TwUtils.props.opacity_255)
                    .delay(.3 / speed).to(.4 / speed, TwUtils.props.opacity_0)
                    .start();

                tween(splash)
                    .to(.2 / speed, { scale: v3(1.2, 2, 1), position: v3(0, 20, 0).add(splash.position) })
                    .to(.8 / speed, { scale: v3(.66, 1, 1), position: v3(0, -50, 0).add(splash.position) })
                    .call(() => {
                        Tween.stopAllByTarget(splash);
                        dataMgr.putToWaterSplashPool(splash);
                    })
                    .start();
            });
        }

        delay(fxNode, 2, () => {
            fxNode.destroy();
        });
    }

    /**
     * 怪物擊飛特效
     */
    makeMonsterFly(wpos3D: Readonly<Vec3>, entities: Monster[], onFlyStartFunc?: (entity: Monster) => void) {
        const range = math.randomRange;
        const tmp_pos = v3(), tmp_rot = v3();
        const tmp_dirXZ = v3();

        for (const ent of entities) {
            if (!ent.isUsing() || !ent.node)
                continue;

            ent.stopMove();
            ent.setUsing(false);
            ent.colliders.forEach(c => c.enabled = false);

            // 先除名, 避免被其它功能重複抓取到
            Game.monsterMgr.removeFromEntitiesMap(ent.getID());

            tmp_dirXZ.set(ent.node.worldPosition).subtract(wpos3D);
            tmp_dirXZ.normalize().multiplyScalar(range(500, 600));

            let time = 0;
            const gravity = -2000;   // 重力
            const dir = v3(tmp_dirXZ.x, range(750, 900), tmp_dirXZ.z);                  // 彈飛方向
            const rot = v3(range(-60, 60), range(-60, 60), range(-60, 60));             // 空中自體旋轉方向

            Game.sndMgr.playOneShot(ent.getHurtSndName());
            onFlyStartFunc?.(ent);

            // to do
            // 請實作怪物擊飛特效
            // 已知條件: 彈飛方向 dir, 自轉方向 rot, 重力 gravity
            // 1. 使用 perFrame() 創建一個每幀更新的 Timer, 並綁定到 ent.node 節點身上
            // 2. 每幀更新時, 計算出新的位置 tmp_pos 和旋轉 tmp_rot (dt 可用 game.deltaTime 取得)
            // 3. 設定 ent.node 的位置和旋轉為 tmp_pos 和 tmp_rot
            // 4. 計算新的重力 dir.y += gravity * dt
            // 5. 計算新的時間 time += dt
            // 6. 當時間 time >= 3.5 時, 停止 Timer, 並將 ent 回收到 Pool 中
            console.log(`to do: 請在這裡實作怪物擊飛特效`);

            // #region 實作時請把這段代碼移除
            const flyNode = ent.node;
            perFrame(flyNode, task => {
                const dt = Math.min(.1, game.deltaTime);    // 避免幀率不穩
                if (time >= 3.5) {
                    task.stop();
                    ent.pushToPool();
                    return;
                }

                tmp_pos.set(dir).multiplyScalar(dt).add(flyNode.worldPosition);
                tmp_rot.set(rot).multiplyScalar(dt).add(flyNode.eulerAngles);
                flyNode.setRotationFromEuler(tmp_rot);
                flyNode.setWorldPosition(tmp_pos);
                

                dir.y += gravity * dt;

                time += dt;
            });
            // #endregion 實作時請把這段代碼移除
        }
    }

    /**
     * 取得水面高度 (3D 世界座標)
     */
    getWaterHeight(): number {
        const h = Game.node.waterLayer.worldPosition.y;
        return h - 28;
    }

}
