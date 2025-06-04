"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiles = exports.zipDir = void 0;
const fs = __importStar(require("fs"));
/**
 * 記錄被放入 Zip 的文件路徑, 用於打包完成後刪除
 */
const deleteFilePaths = [];
/**
 * 讀取目錄及文件
 */
function readDir(zippable, folders, dir, fileExtIncludes, fileSizeLimits) {
    const files = fs.readdirSync(dir);
    const targetDefaultSize = fileSizeLimits.get('default');
    for (let fileName of files) {
        const filePath = `${dir}/${fileName}`;
        const file = fs.statSync(filePath); // 獲取一個文件的屬性
        // 如果是目錄的話，繼續查詢
        if (file.isDirectory()) {
            const newFolders = (folders === '') ? fileName : `${folders}/${fileName}`;
            readDir(zippable, newFolders, filePath, fileExtIncludes, fileSizeLimits); // 重新檢索目錄文件
            continue;
        }
        // 是否有副檔名
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex === -1)
            continue;
        // 取得副檔名
        const extName = fileName.substring(dotIndex);
        if (fileExtIncludes.has(extName)) {
            // 大於目標大小的文件不壓縮
            const targetSize = fileSizeLimits.get(extName) ?? targetDefaultSize;
            if (targetSize !== 0 && (file.size / 1024) > targetSize)
                continue;
            const keyName = (folders === '') ? fileName : `${folders}/${fileName}`;
            zippable[keyName] = fs.readFileSync(filePath);
            deleteFilePaths.push(filePath);
        }
    }
}
/**
 * 開始壓縮文件
 */
function zipDir(name, dir, dist, bundleVersion, fileExtIncludes, fileSizeLimits) {
    return new Promise((resolve, reject) => {
        const zippable = {};
        readDir(zippable, '', dir, fileExtIncludes, fileSizeLimits);
        // @ts-ignore
        const zipped = globalThis.fflate.zipSync(zippable, { level: 9 });
        let ver = bundleVersion[name] ?? '';
        if (ver.length > 0)
            ver = `.${ver}`;
        fs.writeFileSync(`${dist}/${name}${ver}.zip`, zipped, 'utf-8');
        resolve();
    });
}
exports.zipDir = zipDir;
/**
 * 用於打包完成後刪除相同的文件 (如果需要的話)
 */
function deleteFiles() {
    const fileCount = deleteFilePaths.length;
    for (let i = 0; i < fileCount; ++i) {
        let path = deleteFilePaths.pop();
        fs.unlinkSync(path);
    }
}
exports.deleteFiles = deleteFiles;
