import { assetManager } from 'cc';
import { DEV, PREVIEW, HTML5 } from 'cc/env';

const ZipCache = new Map<string, any>();
const ResCache = new Map<string, any>();
const ResCacheJsonVersion = new Map<string, number>();

class _ZipBundleLoader {

    loadedZipNames = new Array<string>();

    private downloadZip(path: string, md5: string) {
        return new Promise<ArrayBuffer | null>((resolve) => {
            let match = path.match(/[^/]+$/);
            if (match === null) {
                resolve(null);
                return;
            }

            let name = match[0];
            let filename = `${name}${md5}.zip`;
            assetManager.downloader.downloadFile(`${path}/${filename}`,
                { xhrResponseType: 'arraybuffer' }, null,
                (err, data) => {
                    resolve(data);
                }
            );
        });
    }

    async loadZip(path: string, bundleVers: string) {
        let md5 = bundleVers ? `.${bundleVers}` : '';
        const zipBuffer = await this.downloadZip(path, md5);
        if (zipBuffer !== null) {
            const dirName = path.replace(/(.*?)\/assets\//, 'assets/');
            globalThis.fflate.unzip(new Uint8Array(zipBuffer), (err, unzipped) => {
                if (err) {
                    console.warn('Unzip failed:', err.message);
                    return;
                }

                // console.log('unzipped:', unzipped);
                Object.keys(unzipped).forEach(key => {
                    // 將絕對路徑 & 相對路徑都指向同一個資源
                    ZipCache.set(`${path}/${key}`, unzipped[key]);
                    ZipCache.set(`${dirName}/${key}`, unzipped[key]);
                });
            });
        }
    }

    init() {
        if (!globalThis.fflate) {
            console.error('fflate is not found.');
            return;
        }

        const accessor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response');
        Object.defineProperty(XMLHttpRequest.prototype, 'response', {
            get: function () {
                if (this.ZipCacheUrl) {
                    return ResCache.get(this.ZipCacheUrl);
                }
                //@ts-ignore
                return accessor.get.call(this);
            },
            set: function (str: string) {
            },
            configurable: true,
        });

        // 攔截 open
        const oldOpen = XMLHttpRequest.prototype.open;
        // @ts-ignore
        XMLHttpRequest.prototype.open = function (method, url: string, async, user, password) {
            if (ZipCache.has(url as string)) {
                this.ZipCacheUrl = url;
            }
            //@ts-ignore
            return oldOpen.apply(this, arguments);
        };

        // 攔截 send
        const oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = async function (data) {
            if (this.ZipCacheUrl) {
                if (!ResCache.has(this.ZipCacheUrl)) {
                    const responseType = this.responseType;
                    const cache = ZipCache.get(this.ZipCacheUrl);

                    let resData = null as any;
                    switch (responseType) {
                        case 'arraybuffer': {
                            if (cache.buffer)
                                resData = cache.buffer;    // zip 出來的應該都為 Uint8Array
                            else
                                resData = cache;
                            break;
                        }
                        case 'json': {
                            const textDecoder = new TextDecoder();    // default 'utf-8' or 'utf8'
                            const text = textDecoder.decode(cache);
                            resData = JSON.parse(text);
                            break;
                        }
                        case 'text': {
                            const textDecoder = new TextDecoder();    // default 'utf-8' or 'utf8'
                            resData = textDecoder.decode(cache);
                            break;
                        }
                        default: {
                            console.error('Unknown type in zipCache:', responseType);
                        }
                    }

                    const jsonVersionOld = ResCacheJsonVersion.get(this.ZipCacheUrl);
                    if (jsonVersionOld) {
                        ResCache.delete(`${this.ZipCacheUrl}@version${jsonVersionOld}`);
                        ResCacheJsonVersion.delete(this.ZipCacheUrl);
                    }

                    const jsonVersionNew = performance.now();
                    ResCacheJsonVersion.set(this.ZipCacheUrl, jsonVersionNew);

                    this.ZipCacheUrl = `${this.ZipCacheUrl}@version${jsonVersionNew}`;
                    ResCache.set(this.ZipCacheUrl, resData);
                }
                //@ts-ignore
                this.onload();
                return;
            }
            //@ts-ignore
            return oldSend.apply(this, arguments);
        }
    }

}

let instance = globalThis.__zipBundleLoader as _ZipBundleLoader;
if (!DEV && !PREVIEW && HTML5 && (globalThis.fflate && !instance)) {
    instance = new _ZipBundleLoader();
    globalThis.__zipBundleLoader = instance;
    instance.init();
}

export { instance as ZipBundleLoader }
