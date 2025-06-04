"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = void 0;
exports.configs = {
    'web-mobile': {
        hooks: './build/web-mobile',
        options: {
            loadZipBundle: {
                label: '啟用 Zip Bundle 功能',
                description: '可以將 Bundle 目錄打包成 Zip 檔案, 以減少網路請求次數',
                default: false,
                render: {
                    ui: 'ui-checkbox',
                }
            },
            zipBundleNames: {
                label: 'Zip Bundle 列表',
                description: '輸入需要 Zip 的 Bundle 名稱, 以逗號分隔\n例如: bundle1, bundle2',
                default: '',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: bundle1, bundle2',
                    }
                }
            },
            zippedFileExtNames: {
                label: 'Zip Bundle 內容文件',
                description: '輸入需要放入 Zip Bundle 的文件副檔案名, 以逗號分隔\n例如: .plist, .cconb',
                default: '.plist, .cconb',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: .plist, .cconb',
                    }
                }
            },
            zippedFileSize: {
                label: 'Zip Bundle 內容文件大小限制 (KB)',
                description: '輸入需要放入 Zip Bundle 的文件大小限制, 可指定文件大小\n例如: 256, .bin: 128',
                default: '0',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: 256, .bin: 128',
                    }
                }
            }
        },
    },
    'android': {
        hooks: './build/android',
    }
};
