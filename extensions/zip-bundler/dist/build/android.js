"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBeforeBuild = void 0;
const onBeforeBuild = async function (options, result) {
    await sleep(3000);
};
exports.onBeforeBuild = onBeforeBuild;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
