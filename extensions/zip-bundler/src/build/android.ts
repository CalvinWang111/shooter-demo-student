import { IBuildTaskOption, BuildHook, IBuildResult } from '../../@types';

export const onBeforeBuild: BuildHook.onBeforeBuild = async function (options: IBuildTaskOption, result: IBuildResult) {
    await sleep(3000)
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}