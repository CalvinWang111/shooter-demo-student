import { Animation, AnimationClip, AnimationState, Node, sp } from 'cc'

type WrapMode = AnimationClip.WrapMode;
type TrackEntry = sp.spine.TrackEntry;

/**
 * 播放 Creator 動畫 (overwriteWrapMode = null 表示不更改 clip 預設值)
 * 適用 Animation 與 SkeletalAnimation 元件
 */
export function playAnime(actor: Node | Animation, name: string = '', overwriteWrapMode: WrapMode = null, endFunc: Function = null): AnimationState {
    return playAnimeFunc(1, actor, name, overwriteWrapMode, endFunc);
}

/**
 * 播放 Creator 動畫 (overwriteWrapMode = null 表示不更改 clip 預設值)
 * 適用 Animation 與 SkeletalAnimation 元件
 */
export function playAnimeCrossFade(actor: Node | Animation, name: string = '', overwriteWrapMode: WrapMode = null, endFunc: Function = null): AnimationState {
    return playAnimeFunc(2, actor, name, overwriteWrapMode, endFunc);
}

/**
 * 播放 Spine 動畫 (Spine 使用 Cache Mode 時, 將不會回傳 TrackEntry)
 */
export function playSpine(spine: Node | sp.Skeleton, name: string, loop: boolean = false, endFunc: Function = null, trackIdx: number = 0): sp.spine.TrackEntry {
    // @ts-ignore
    const skel: sp.Skeleton = (skel.setAnimation) ? spine : spine.getComponent(sp.Skeleton);

    let entry = null as TrackEntry;
    if (skel) {
        skel.setCompleteListener(null);
        entry = skel.setAnimation(trackIdx, name, loop);

        if (!endFunc)
            return entry;

        skel.setCompleteListener((e: TrackEntry) => {
            if (e.trackIndex === trackIdx && e.animation.name === name)    // 防呆: 確保是同一個動畫
                endFunc();
        });
    }
    return entry;
}

/**
 * 播放 Creator 動畫 (內部函式)
 */
function playAnimeFunc(type: 1 | 2, anime: Node | Animation, name: string = '', overwriteWrapMode: WrapMode = null, endFunc: Function = null): AnimationState {
    // @ts-ignore
    const anim: Animation = (anime.play) ? anime : anime.getComponent(Animation);

    let st = null as AnimationState;
    if (anim) {
        if (name === '' || name === null) {
            if (anim.defaultClip) name = anim.defaultClip.name;
            else if (anim.clips[0]) name = anim.clips[0].name;
            else name = '';
        }

        const e = Animation.EventType;
        anim.off(e.FINISHED);
        switch (type) {
            case 1: anim.play(name); break;
            case 2: anim.crossFade(name); break;
        }

        st = anim.getState(name);
        if (st === null)
            return st;

        if (overwriteWrapMode !== null)    // WrapMode could be 'zero' number
            st.wrapMode = overwriteWrapMode;

        if (endFunc)
            anim.once(e.FINISHED, () => endFunc());
    }
    return st;
}
