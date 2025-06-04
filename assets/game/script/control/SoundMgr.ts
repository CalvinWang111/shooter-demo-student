import { _decorator, assetManager, AudioClip, AudioSource, Component, error, game, Game as CC_Game, Node, Tween, sys } from 'cc';
import { Game } from '../system/Game';

type WaitingInfo = {
    type: 'Music' | 'Effect';
    name: string; loop: boolean; interrupt: boolean;
};

const { ccclass, property } = _decorator;

@ccclass('SoundMgr')
export class SoundMgr extends Component {

    // #region Properties
    @property({ tooltip: '音樂所在的 Bundle 名稱' })
    bundleName = 'game';

    @property({ tooltip: '音效所在的資料夾名稱' })
    sndDir = 'res/sound';
    // #endregion

    private isMute = false;        // 是否靜音
    private musicVol = 1;          // 音樂音量
    private effectVol = 1;         // 音效音量

    private __isMute = false;      // 記錄隱藏前的狀態
    private __musicVol = 1;        // 記錄隱藏前的狀態
    private __effectVol = 1;       // 記錄隱藏前的狀態

    private sndMap = new Map<string, AudioClip>();
    private waitingList = new Map<string, WaitingInfo[]>();
    private audioSrcList = new Array<AudioSource>();

    // 是否阻擋播放音效
    // 瀏覽器環境下, 首次點擊畫面後才允許播放聲音,
    // 若點擊前累積播放了很多音效, 當點擊時會突然爆音
    private isBlockPlayEffect = false;

    onLoad() {
        Game.sndMgr = this;
        Game.dataMgr.freeOnStageDestroy(() => Game.sndMgr = null);
        this.init();
    }

    onDestroy() {
        game.off(CC_Game.EVENT_SHOW, this.onDisplay, this);
        game.off(CC_Game.EVENT_HIDE, this.onHidden, this);

        Tween.stopAllByTarget(this.node);
        this.audioSrcList.length = 0;
        this.waitingList.clear();
        this.sndMap.clear();
    }

    /**
     * 初始化設定
     */
    private init() {
        this.preloadSndDir();
        this.audioSrcList.push(this.node.addComponent(AudioSource));
        this.audioSrcList.push(this.node.addComponent(AudioSource));
        this.audioSrcList.forEach(audSrc => audSrc.playOnAwake = false);
        this.effectVolume = .75;
        this.musicVolume = .85;

        this.saveStates();
        game.on(CC_Game.EVENT_SHOW, this.onDisplay, this);
        game.on(CC_Game.EVENT_HIDE, this.onHidden, this);

        this.isBlockPlayEffect = false;
        this.checkBrowserIssue();
    }

    /**
     * 避免首次點擊畫面後音效爆音 (瀏覽器的限制)
     */
    private checkBrowserIssue() {
        if (!sys.isBrowser)
            return;
        if (Game.getValue<string>('IsBlockPlayEffect') === 'FALSE')    // 遊戲運行後已經點擊過了
            return;

        this.isBlockPlayEffect = true;
        const cancelBlock = () => {
            this.isBlockPlayEffect = false;
            Game.setValue('IsBlockPlayEffect', 'FALSE');
        };
        document.addEventListener('pointerdown', cancelBlock, { once: true });
    }

    private saveStates() {
        this.__isMute = this.isMute;
        this.__musicVol = this.musicVol;
        this.__effectVol = this.effectVol;
    }

    private onDisplay() {
        if (!this.__isMute)
            this.mute = false;

        this.musicVolume = this.__musicVol;      // setter
        this.effectVolume = this.__effectVol;    // setter
    }

    private onHidden() {
        this.saveStates();

        if (!this.isMute)
            this.mute = true;
    }

    private preloadSndDir() {
        const request = { dir: this.sndDir, bundle: this.bundleName };
        const option = { type: AudioClip, priority: -1 };

        assetManager.loadAny(request, option, (err, clips: AudioClip[]) => {
            if (err) {
                error(err.message);
                return;
            }

            // 檢查待播清單的方法
            const checkWaitings = (name: string) => {
                const { waitingList } = this;
                if (waitingList.has(name)) {
                    const list = waitingList.get(name)!;
                    waitingList.delete(name);
                    list.forEach(info => {
                        if (info.type === 'Music')
                            this.playMusic(info.name, info.loop);
                        if (info.type === 'Effect')
                            this.playEffect(info.name, info.loop, info.interrupt);
                    });
                }
            };

            // 下載完成後, 將音效加入 Map
            const sndMap = this.sndMap;
            clips.forEach(clip => {
                const name = clip.name;
                sndMap.set(name, clip);
                checkWaitings(name);
            });
        });
    }

    private addToWaitingList(info: Readonly<WaitingInfo>) {
        const name = info.name;
        const { waitingList } = this;
        const list = waitingList.get(name) ?? [];
        waitingList.set(name, list);
        list.push(info);
    }

    /**
     * 播放背景音樂 (若音效尚未加載完成, 會等到加載完成後再播放)
     */
    playMusic(name: string, loop: boolean) {
        if (name === '')
            return;

        this.stopMusic();

        const clip = this.sndMap.get(name);
        if (!clip) {
            const type = 'Music', interrupt = true;    // 背景音樂本來就同時間只能有一個在播放
            this.addToWaitingList({ type, name, loop, interrupt });
            return;
        }

        const audSrc = this.audioSrcList[0];
        audSrc.clip = clip;
        audSrc.loop = loop;
        audSrc.play();
    }

    /**
     * 播放音效 (若音效尚未加載完成, 預設會忽略這次播放請求)
     */
    playEffect(name: string, loop: boolean, interrupt: boolean, canWait: boolean = false) {
        if (name === '')
            return;

        const clip = this.sndMap.get(name);
        if (!clip) {
            if (canWait) {
                const type = 'Effect';
                this.addToWaitingList({ type, name, loop, interrupt });
            }
            return;
        }

        if (this.isMute || this.isBlockPlayEffect)
            return;

        if (!interrupt && !loop) {
            this.playOneShot(name);
            return;
        }

        if (interrupt)
            this.stopEffect(name);

        // 新增一個音效節點, 播放音效
        const sndNode = new Node(name);
        const audSrc = sndNode.addComponent(AudioSource);
        const myVol = (this.isMute ? 0 : this.effectVol);
        sndNode.setParent(this.node);

        audSrc.playOnAwake = false;
        audSrc.volume = myVol;
        audSrc.clip = clip;
        audSrc.loop = loop;
        audSrc.play();

        if (!loop) {
            sndNode.once(AudioSource.EventType.ENDED, () => {
                sndNode.destroy();
            });
        }
    }

    /**
     * 直接播放一次性音效 (若音效尚未加載完成, 則忽略這次播放請求)
     */
    playOneShot(name: string) {
        if (name === '')
            return;

        if (this.isMute || this.isBlockPlayEffect)
            return;

        const clip = this.sndMap.get(name);
        if (clip) {
            const audSrc = this.audioSrcList[1];
            audSrc.playOneShot(clip);
        }
    }

    /**
     * 停止背景音樂 (同時間只能有一個背景音樂在播放)
     */
    stopMusic() {
        const audSrc = this.audioSrcList[0];
        if (audSrc.clip && audSrc.playing)
            audSrc.stop();

        // 同時間只能有一個背景音樂在播放
        const { waitingList } = this;
        const waitings = Array.from(waitingList.values());
        waitings.forEach(list => {
            if (list[0].type === 'Music') {
                waitingList.delete(list[0].name);
                return;
            }
        });
    }

    /**
     * 停止音效 (不包含 PlayOneShot )
     */
    stopEffect(name: string) {
        const children = this.node.children;
        for (let i = children.length - 1; i >= 0; --i) {
            const sndNode = children[i];
            if (sndNode.name === name) {
                sndNode.getComponent(AudioSource)?.stop();
                sndNode.destroy();
            }
        }

        // 等待中的音效也要停止
        const { waitingList } = this;
        const waitings = Array.from(waitingList.values());
        waitings.forEach(list => {
            if (list[0].name === name && list[0].type === 'Effect') {
                waitingList.delete(list[0].name);
                return;
            }
        });
    }

    set musicVolume(vol: number) {
        const myVol = (this.isMute ? 0 : vol);
        this.musicVol = vol;
        this.audioSrcList[0].volume = myVol;
    }

    get musicVolume(): number {
        return this.musicVol;
    }

    get effectVolume(): number {
        return this.effectVol;
    }

    set effectVolume(vol: number) {
        const myVol = (this.isMute ? 0 : vol);
        this.effectVol = vol;
        this.audioSrcList[1].volume = myVol;

        const children = this.node.children;
        for (let i = children.length - 1; i >= 0; --i) {
            const sndNode = children[i];
            const audSrc = sndNode.getComponent(AudioSource);
            audSrc.volume = myVol;
        }
    }

    get mute(): boolean {
        return this.isMute;
    }

    set mute(isMute: boolean) {
        this.isMute = isMute;
        this.musicVolume = this.musicVol;      // setter
        this.effectVolume = this.effectVol;    // setter
    }

}
