import { _decorator, AssetManager, assetManager, Component, director, Settings, settings } from 'cc';
import { ZipBundleLoader } from './ZipBundleLoader';

// 勿刪除這個變數 (zip-bundler 插件會修改這行代碼使其有值)
const lstZipBundleName: string[] = ['game'];

const { ccclass, property } = _decorator;

@ccclass('Launcher')
export class Launcher extends Component {

    // #region Properties
    @property({ tooltip: '遊戲所在的 Bundle 名稱' })
    bundleName = 'game';

    @property({ tooltip: '要啟動的場景名稱' })
    sceneName = 'Game';
    // #endregion

    onLoad() {
        const loadingList = [
            this.loadBundle(this.bundleName),
            this.loadZip(this.bundleName, false)
        ];

        Promise.all(loadingList).then(values => {
            const bundle = values[0] as AssetManager.Bundle;
            bundle?.loadScene(this.sceneName, (_, scene) => {
                director.runSceneImmediate(scene);
            });
        });
    }

    /**
     * 載入 Bundle
     */
    async loadBundle(nameOrUrl: string, options: object = null): Promise<AssetManager.Bundle> {
        return new Promise(resolve => {
            assetManager.loadBundle(nameOrUrl, options, (err, bundle) => {
                if (err) { resolve(null); return; }
                resolve(bundle);
            });
        });
    }

    /**
     * 
     * 載入 Zip 包
     */
    async loadZip(bundleName: string, isRemote: boolean, remoteURL: string = '', remoteVer: string = '') {
        if (!ZipBundleLoader)
            return;

        if (ZipBundleLoader.loadedZipNames.indexOf(bundleName) >= 0)      // 已經載入過
            return;

        if (!isRemote && lstZipBundleName.indexOf(bundleName) === -1)     // 不是遠程包且不在清單中
            return;

        let path = remoteURL, ver = remoteVer;
        if (!isRemote) {
            const bundleVersion = settings.querySettings(Settings.Category.ASSETS, 'bundleVers');
            path = `./assets/${bundleName}`;
            ver = bundleVersion[bundleName];
        }

        ZipBundleLoader.loadedZipNames.push(bundleName);
        await ZipBundleLoader.loadZip(path, ver);
    }

}
