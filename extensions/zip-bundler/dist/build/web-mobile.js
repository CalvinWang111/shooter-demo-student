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
exports.onAfterBuild = exports.onBeforeBuild = exports.throwError = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zip_1 = require("../zip");
const PACKAGE_NAME = 'zip-bundler';
exports.throwError = true;
const onBeforeBuild = async function (options, result) {
    await writeZipBundleNames(options, result);
};
exports.onBeforeBuild = onBeforeBuild;
const onAfterBuild = async function (options, result) {
    const bundleVers = fs.readFileSync(result.paths.settings).toString('utf8');
    const bundleStudent = JSON.parse(bundleVers);
    await makeZipBundles(options, result, bundleStudent.assets.bundleVers);
};
exports.onAfterBuild = onAfterBuild;
function hasZipBundleBuild(options) {
    if (options.platform !== 'web-mobile' && options.platform !== 'web-desktop')
        return false;
    const myPackage = options.packages?.[PACKAGE_NAME];
    const checkPackage = (!myPackage || !myPackage.loadZipBundle ||
        myPackage.zipBundleNames.length <= 0 ||
        myPackage.zippedFileExtNames.length <= 0);
    if (checkPackage)
        return false;
    return true;
}
/**
 * 寫入 Zip Bundle 名稱到 FeatureManagerComponent.ts
 */
async function writeZipBundleNames(options, result) {
    console.log(`Start writing zip bundle names to FeatureManagerComponent.ts`);
    // 就算沒有啟用 Zip Bundle 功能, 也要對 lstZipBundleName 寫入空列表
    let str = '';
    if (hasZipBundleBuild(options)) {
        const myPackage = options.packages[PACKAGE_NAME];
        const zipBundleNames = myPackage.zipBundleNames;
        const nameList = zipBundleNames.trim().replaceAll(' ', '').split(',').filter(name => name.length > 0);
        nameList.forEach((name, i) => {
            str += `'${name}'`;
            if (i < nameList.length - 1)
                str += ', ';
        });
    }
    const tsPath = 'assets/Launcher.ts';
    let text = fs.readFileSync(path.join(Editor.Project.path, tsPath), 'utf-8');
    text = text.replace(/const lstZipBundleName: string\[\] = \[(.*?)\];/, `const lstZipBundleName: string[] = [${str}];`);
    fs.writeFileSync(path.join(Editor.Project.path, tsPath), text, 'utf-8');
}
/**
 * 如果有啟用 Zip Bundle 功能, 則在打包完成後執行此函數
 */
async function makeZipBundles(options, result, bundleVers) {
    console.log(`Start making bundle zip files for ${PACKAGE_NAME}`);
    if (!hasZipBundleBuild(options))
        return;
    const myPackage = options.packages[PACKAGE_NAME];
    const zipBundleNames = myPackage.zipBundleNames;
    const bundleNames = zipBundleNames.trim().replaceAll(' ', '').split(',').filter(name => name.length > 0);
    if (bundleNames.length <= 0)
        return;
    const zippedFileExtNames = myPackage.zippedFileExtNames;
    const extNames = zippedFileExtNames.trim().replaceAll(' ', '').split(',').filter(name => name.length > 0);
    if (extNames.length <= 0)
        return;
    console.log(`Start zip files for ${extNames.toString()}`);
    // 對 assets 目錄下指定的 Bundle 進行 Zip 打包
    if (fs.existsSync(result.dest + '/assets')) {
        const folderNames = fs.readdirSync(result.dest + '/assets/').filter(folderName => {
            return bundleNames.some(bundleName => folderName.includes(bundleName));
        });
        const zippedFileSize = myPackage.zippedFileSize.toString(); // 防呆, 避免是 number type
        const sizeLimits = parseZippedFileSizeData(zippedFileSize);
        const includes = new Map(extNames.map((str, i) => [str, i]));
        const zipBundles = folderNames.map(async (folderName) => {
            const path = result.dest + '/assets/' + folderName, outPath = path;
            return (0, zip_1.zipDir)(folderName, path, outPath, bundleVers, includes, sizeLimits);
        });
        await Promise.all(zipBundles).then(() => {
            // deleteFiles();    // 先不刪
        });
    }
}
function parseZippedFileSizeData(rawStr) {
    const fileSizeLimits = new Map();
    rawStr.trim().replaceAll(' ', '').split(',').forEach(str => {
        const pair = str.split(':');
        if (pair.length === 2) {
            fileSizeLimits.set(pair[0], parseFloat(pair[1]));
        }
        else {
            const num = parseFloat(str);
            if (!isNaN(num)) {
                fileSizeLimits.set('default', num);
            }
        }
    });
    if (!fileSizeLimits.has('default')) {
        fileSizeLimits.set('default', 0);
    }
    return fileSizeLimits;
}
