import * as fs from 'fs';

/**
 * 記錄被放入 Zip 的文件路徑, 用於打包完成後刪除
 */
const deleteFilePaths: string[] = [];

/**
 * 讀取目錄及文件
 */
function readDir(zippable: any, folders: string, dir: string, fileExtIncludes: Map<string, number>, fileSizeLimits: Map<string, number>) {
    const files = fs.readdirSync(dir);
    const targetDefaultSize = fileSizeLimits.get('default')!;

    for (let fileName of files) {
        const filePath = `${dir}/${fileName}`;
        const file = fs.statSync(filePath);    // 獲取一個文件的屬性

        // 如果是目錄的話，繼續查詢
        if (file.isDirectory()) {
            const newFolders = (folders === '') ? fileName : `${folders}/${fileName}`;
            readDir(zippable, newFolders, filePath, fileExtIncludes, fileSizeLimits);    // 重新檢索目錄文件
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
                continue

            const keyName = (folders === '') ? fileName : `${folders}/${fileName}`;
            zippable[keyName] = fs.readFileSync(filePath);
            deleteFilePaths.push(filePath);
        }
    }
}

/**
 * 開始壓縮文件
 */
export function zipDir(name: string, dir: string, dist: string, bundleVersion: Record<string, string>, fileExtIncludes: Map<string, number>, fileSizeLimits: Map<string, number>) {
    return new Promise<void>((resolve, reject) => {
        const zippable = {};
        readDir(zippable, '', dir, fileExtIncludes, fileSizeLimits);

        // @ts-ignore
        const zipped = globalThis.fflate.zipSync(zippable, { level: 9 });
        let ver = bundleVersion[name] ?? '';
        if (ver.length > 0) ver = `.${ver}`;
        fs.writeFileSync(`${dist}/${name}${ver}.zip`, zipped, 'utf-8');
        resolve();
    });
}

/**
 * 用於打包完成後刪除相同的文件 (如果需要的話)
 */
export function deleteFiles() {
    const fileCount = deleteFilePaths.length;
    for (let i = 0; i < fileCount; ++i) {
        let path = deleteFilePaths.pop();
        fs.unlinkSync(path);
    }
}
