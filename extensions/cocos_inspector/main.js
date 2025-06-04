'use strict';
const _0x2697 = [
    '538083ZhrOsf',
    'query-port',
    'versions',
    'v.switchMo',
    'how',
    'version',
    'nfigDataFo',
    'DxEBS',
    'ZBUAV',
    'ChEHa',
    'YXZEQ',
    'name',
    'DQKTb',
    'setMenuBar',
    'rTDbM',
    'cjDvj',
    'webContent',
    'split',
    'join',
    ':focusNode',
    'unselect',
    'ch-asset',
    'exports',
    'ui-kit:tou',
    'getContent',
    '704176ZVPhIn',
    'error',
    '5iiNOPC',
    'ent\x20size',
    'setContent',
    'UvMbm',
    'size',
    'utf-8',
    '324899HafsEV',
    'Size',
    'append',
    'kZiez',
    'resize',
    'kRYtj',
    'loadURL',
    'TaqKl',
    'setImage',
    'Menu',
    'BMrgs',
    'fixed\x20cont',
    'process',
    './package.',
    'i\x20Mode',
    'then',
    'electron',
    'nspector-c',
    'avqcF',
    'apMed',
    'Toggle\x20Min',
    'ector\x20v',
    'file://',
    'cVkCQ',
    'isteners',
    'Message',
    'isPortrait',
    ':focusAsse',
    'EFboH',
    'path',
    'Visibility',
    'createFrom',
    'show',
    'openDevToo',
    'has\x20tray\x20a',
    'setMenu',
    'MDwbq',
    '412561lsHCSC',
    'getSelecte',
    'ocUuP',
    './icon.png',
    'FjFxM',
    'onfig.json',
    'QcgfT',
    'mainPreloa',
    'json',
    'POdqu',
    'srpdJ',
    'iyDuD',
    'KZEzO',
    'setting.to',
    'electron.h',
    'request',
    'Path',
    'asset',
    'setting.co',
    'lready!',
    'readFileSy',
    'OpenDevToo',
    'destroy',
    'HPxoY',
    'ready-to-s',
    'wezvd',
    'oNdGy',
    'tml',
    'index_low_',
    '1QJMfVw',
    'RzWgt',
    '1942KctboM',
    'warn',
    'aScript',
    'closed',
    'broadcast',
    'XzKjR',
    'de(',
    'ggleSimple',
    'BBGmM',
    'removeAllL',
    'simpleMode',
    'VVdAU',
    'OoeWq',
    'KQwkr',
    'Selection',
    'select',
    'qIAUo',
    'executeJav',
    'parse',
    'click',
    'HvRBY',
    'disableWeb',
    'rcrEr',
    'd.js',
    'node',
    'setContext',
    'Sec',
    '&mode=',
    '../cocos-i',
    'index.html',
    '31jHPWgu',
    'rMain',
    'Cocos\x20Insp',
    'config.jso',
    'server',
    '#2e2c29',
    'Mode()',
    'existsSync',
    '3218qsKJZy',
    '239XEVEVQ',
    '?port=',
    '452563ygLjHK'
];
const _0x49983f = _0x1f97;
(function (_0x36ef80, _0x453a69) {
    const _0x2fb98a = _0x1f97;
    while (!![]) {
        try {
            const _0x272c7a = -parseInt(_0x2fb98a(0xcb)) + -parseInt(_0x2fb98a(0x9f)) * parseInt(_0x2fb98a(0xec)) + parseInt(_0x2fb98a(0xa1)) * -parseInt(_0x2fb98a(0xbf)) + -parseInt(_0x2fb98a(0xca)) + parseInt(_0x2fb98a(0xc7)) * parseInt(_0x2fb98a(0xc8)) + -parseInt(_0x2fb98a(0xe4)) + -parseInt(_0x2fb98a(0xe6)) * -parseInt(_0x2fb98a(0x82));
            if (_0x272c7a === _0x453a69)
                break;
            else
                _0x36ef80['push'](_0x36ef80['shift']());
        } catch (_0x52834b) {
            _0x36ef80['push'](_0x36ef80['shift']());
        }
    }
}(_0x2697, -0x4 * -0xce07 + 0x93e89 + -0xfd35));
const {BrowserWindow, app, remote, ipcMain, Menu, Tray, nativeImage, MenuItem} = require(_0x49983f(0xfc)), path = require(_0x49983f(0x109)), pcs = require(_0x49983f(0xf8)), os = require('os'), folder = '', devTools = ![];
function _0x1f97(_0x20c574, _0x5e890f) {
    _0x20c574 = _0x20c574 - (0x1744 + -0x16ac + -0x18);
    let _0x364aa9 = _0x2697[_0x20c574];
    return _0x364aa9;
}
let win, tray = null, mode = 0x230f + -0x1709 + 0x3 * -0x402, unloaded = ![];
const PKG_NAME = require(_0x49983f(0xf9) + _0x49983f(0x8a))[_0x49983f(0xd6)], PKG_VERSION = require(_0x49983f(0xf9) + _0x49983f(0x8a))[_0x49983f(0xd0)];
let fs = require('fs'), _configPath = path[_0x49983f(0xdd)](__dirname, _0x49983f(0xc2) + 'n'), __parentConfig = path[_0x49983f(0xdd)](__dirname, _0x49983f(0xbd) + _0x49983f(0xfd) + _0x49983f(0x87));
function readConfig() {
    const _0xa5f0f5 = _0x49983f, _0x13eefe = { 'qIAUo': _0xa5f0f5(0xeb) };
    let _0x330c55 = '';
    return fs[_0xa5f0f5(0xc6)](__parentConfig) ? _0x330c55 = fs[_0xa5f0f5(0x96) + 'nc'](__parentConfig, { 'encoding': _0x13eefe[_0xa5f0f5(0xb1)] }) : _0x330c55 = fs[_0xa5f0f5(0x96) + 'nc'](_configPath, { 'encoding': _0x13eefe[_0xa5f0f5(0xb1)] }), JSON[_0xa5f0f5(0xb3)](_0x330c55);
}
let config = readConfig(), disableWebSec = Boolean(config[_0x49983f(0xb6) + _0x49983f(0xbb)]), dw = 0x101 * -0xb + -0x402 + 0xf0d, dh = 0x33b + -0x43a * -0x8 + -0x57 * 0x6d;
function changeDWH() {
    const _0x2f0fcd = _0x49983f, _0x4e7d20 = {
            'apMed': function (_0x6338c7, _0x20e99a) {
                return _0x6338c7 + _0x20e99a;
            }
        };
    dw = config[_0x2f0fcd(0xab)] ? config[_0x2f0fcd(0x106)] ? config[_0x2f0fcd(0xea)][0x1 * 0x12ef + -0x22ad + -0x326 * -0x5] : config[_0x2f0fcd(0xea)][0x1a3 * -0xe + 0xe4d + 0x89e] : -0xcea + 0x1 * -0x28a + 0x1 * 0x12e2, dh = config[_0x2f0fcd(0xab)] ? _0x4e7d20[_0x2f0fcd(0xff)](config[_0x2f0fcd(0x106)] ? config[_0x2f0fcd(0xea)][0x1062 + -0x1ffa + 0xf99] : config[_0x2f0fcd(0xea)][-0x1 * -0x925 + 0xee4 * 0x2 + -0x26ed], -0x1470 + 0x210 + -0x3b7 * -0x5) : -0x10f3 * -0x1 + 0xb40 * 0x2 + 0x251b * -0x1;
}
changeDWH(), module[_0x49983f(0xe1)] = {
    async 'load'() {
        const _0x270c8a = _0x49983f;
        ipcMain['on'](PKG_NAME + _0x270c8a(0xde), focusNode), ipcMain['on'](PKG_NAME + (_0x270c8a(0x107) + 't'), focusAsset);
    },
    'unload'() {
        const _0x2cdc6e = _0x49983f;
        unloaded = !![], ipcMain[_0x2cdc6e(0xaa) + _0x2cdc6e(0x104)](PKG_NAME + _0x2cdc6e(0xde)), ipcMain[_0x2cdc6e(0xaa) + _0x2cdc6e(0x104)](PKG_NAME + (_0x2cdc6e(0x107) + 't'));
    },
    'methods': {
        'previewMode'() {
            const _0x88d74b = _0x49983f, _0xe1d33f = {
                    'FjFxM': function (_0x30b178, _0x1e693d) {
                        return _0x30b178(_0x1e693d);
                    }
                };
            if (unloaded)
                return;
            _0xe1d33f[_0x88d74b(0x86)](tryShowWindow, 0x1a53 * 0x1 + 0x17c1 * -0x1 + -0x292);
        },
        'buildMobileMode'() {
            const _0x45c767 = _0x49983f, _0x5e501a = {
                    'srpdJ': function (_0x17285f, _0xa9c04c) {
                        return _0x17285f(_0xa9c04c);
                    }
                };
            if (unloaded)
                return;
            _0x5e501a[_0x45c767(0x8c)](tryShowWindow, 0x1 * 0xec5 + 0x200 * -0x1 + -0xcc4);
        },
        'buildDesktopMode'() {
            const _0x1e0b9c = _0x49983f, _0x405f32 = {
                    'KQwkr': function (_0x560b1a, _0x42b97d) {
                        return _0x560b1a(_0x42b97d);
                    }
                };
            if (unloaded)
                return;
            _0x405f32[_0x1e0b9c(0xae)](tryShowWindow, 0x25c8 + 0x8cf + -0x2e94);
        },
        'openCustomPage'() {
            const _0x32419f = _0x49983f, _0x4493af = {
                    'BBGmM': function (_0x31820e, _0x29281c) {
                        return _0x31820e(_0x29281c);
                    }
                };
            if (unloaded)
                return;
            _0x4493af[_0x32419f(0xa9)](tryShowWindow, 0x808 + 0x1fa5 * 0x1 + -0xf * 0x2a5);
        }
    }
};
function focusNode(_0x177ef7, _0x1f6592) {
    const _0x37f709 = _0x49983f, _0x3fedd7 = { 'wezvd': _0x37f709(0xb9) };
    let _0x3e7f0a = Editor[_0x37f709(0xaf)][_0x37f709(0x83) + 'd'](_0x3fedd7[_0x37f709(0x9b)]);
    Editor[_0x37f709(0xaf)][_0x37f709(0xdf)](_0x3fedd7[_0x37f709(0x9b)], _0x3e7f0a), Editor[_0x37f709(0xaf)][_0x37f709(0xb0)](_0x3fedd7[_0x37f709(0x9b)], _0x1f6592);
}
function focusAsset(_0x343d07, _0x4d5a41) {
    const _0x5bf8bb = _0x49983f, _0x53749a = {
            'cVkCQ': _0x5bf8bb(0xe2) + _0x5bf8bb(0xe0),
            'avqcF': _0x5bf8bb(0x93)
        };
    Editor[_0x5bf8bb(0x105)][_0x5bf8bb(0xa5)](_0x53749a[_0x5bf8bb(0x103)], _0x4d5a41);
    let _0x3ffab1 = Editor[_0x5bf8bb(0xaf)][_0x5bf8bb(0x83) + 'd'](_0x53749a[_0x5bf8bb(0xfe)]);
    Editor[_0x5bf8bb(0xaf)][_0x5bf8bb(0xdf)](_0x53749a[_0x5bf8bb(0xfe)], _0x3ffab1), Editor[_0x5bf8bb(0xaf)][_0x5bf8bb(0xb0)](_0x53749a[_0x5bf8bb(0xfe)], _0x4d5a41);
}
async function showWindow() {
    const _0x13c845 = _0x49983f, _0x539b1f = {
            'RzWgt': function (_0x2e59c8) {
                return _0x2e59c8();
            },
            'iyDuD': function (_0x22b2c4, _0xd6a4bb) {
                return _0x22b2c4 != _0xd6a4bb;
            },
            'ocUuP': _0x13c845(0xf7) + _0x13c845(0xe7),
            'YXZEQ': _0x13c845(0x94) + _0x13c845(0xd1) + _0x13c845(0xc0),
            'MDwbq': function (_0x4ee670, _0xf4cf70) {
                return _0x4ee670 + _0xf4cf70;
            },
            'rcrEr': _0x13c845(0xc1) + _0x13c845(0x101),
            'OoeWq': _0x13c845(0xc4),
            'QcgfT': _0x13c845(0xf0),
            'XzKjR': _0x13c845(0x9a) + _0x13c845(0xcf),
            'DQKTb': _0x13c845(0xa4),
            'EFboH': function (_0x4cea69, _0x3dc675) {
                return _0x4cea69 >= _0x3dc675;
            },
            'rTDbM': _0x13c845(0xc3),
            'UvMbm': _0x13c845(0xcc),
            'POdqu': function (_0x2e8201, _0x32a9eb) {
                return _0x2e8201 + _0x32a9eb;
            },
            'HvRBY': function (_0x5b3051, _0x52de70) {
                return _0x5b3051 + _0x52de70;
            },
            'KZEzO': function (_0x398074, _0x41541e) {
                return _0x398074 + _0x41541e;
            },
            'BMrgs': _0x13c845(0xc9),
            'DxEBS': _0x13c845(0xbc)
        };
    if (win) {
        win[_0x13c845(0x10c)](), win[_0x13c845(0xdb) + 's'][_0x13c845(0xb2) + _0x13c845(0xa3)](_0x13c845(0xce) + _0x13c845(0xa7) + mode + ')');
        return;
    }
    win = new BrowserWindow({
        'width': dw,
        'height': dh,
        'title': _0x539b1f[_0x13c845(0x81)](_0x539b1f[_0x13c845(0xb7)], PKG_VERSION),
        'backgroundColor': _0x539b1f[_0x13c845(0xad)],
        'autoHideMenuBar': !![],
        'webPreferences': {
            'useContentSize': !![],
            'enablePreferredSizeMode': ![],
            'preferredSizeMode': ![],
            'webviewTag': !![],
            'nodeIntegration': !![],
            'nodeIntegrationInSubFrames': !![],
            'enableRemoteModule': !![],
            'sandbox': ![],
            'devTools': devTools,
            'contextIsolation': ![],
            'webSecurity': !disableWebSec,
            'resizable': !config[_0x13c845(0xab)],
            'minimizable': !config[_0x13c845(0xab)],
            'maximizable': !config[_0x13c845(0xab)],
            'preload': path[_0x13c845(0xdd)](__dirname, folder + (_0x13c845(0x89) + _0x13c845(0xb8)))
        }
    });
    try {
        win[_0x13c845(0x80)](null), win[_0x13c845(0xd8) + _0x13c845(0x10a)](![]), win[_0x13c845(0xd8) + _0x13c845(0x10a)] = win[_0x13c845(0x80)] = function (_0x1bbab0) {
        };
    } catch (_0x1639d4) {
    }
    win['on'](_0x539b1f[_0x13c845(0x88)], () => {
        const _0x51b1a5 = _0x13c845, _0x1a14c3 = {
                'oNdGy': function (_0x3cfe07) {
                    const _0x4d5947 = _0x1f97;
                    return _0x539b1f[_0x4d5947(0xa0)](_0x3cfe07);
                },
                'ZBUAV': function (_0xcc2fca, _0x7a9bcb) {
                    const _0x46a642 = _0x1f97;
                    return _0x539b1f[_0x46a642(0x8d)](_0xcc2fca, _0x7a9bcb);
                },
                'ChEHa': _0x539b1f[_0x51b1a5(0x84)]
            };
        try {
            win[_0x51b1a5(0xdb) + 's'][_0x51b1a5(0xb2) + _0x51b1a5(0xa3)](_0x539b1f[_0x51b1a5(0xd5)])[_0x51b1a5(0xfb)](function (_0x2959ce) {
                const _0x4b9c58 = _0x51b1a5;
                if (_0x2959ce)
                    config = _0x2959ce;
                _0x1a14c3[_0x4b9c58(0x9c)](changeDWH);
                if (config[_0x4b9c58(0xab)] && win[_0x4b9c58(0xdb) + 's']) {
                    let _0x5bf978 = win[_0x4b9c58(0xe3) + _0x4b9c58(0xed)]();
                    (_0x1a14c3[_0x4b9c58(0xd3)](dw, _0x5bf978[0x178f + -0x1c17 + -0x14 * -0x3a]), _0x1a14c3[_0x4b9c58(0xd3)](dh, _0x5bf978[0xd47 + -0x1 * -0x10b3 + -0x1df9 * 0x1])) && (win[_0x4b9c58(0xe8) + _0x4b9c58(0xed)](dw, dh), devTools && console[_0x4b9c58(0xa2)](_0x1a14c3[_0x4b9c58(0xd4)]));
                }
            });
        } catch (_0x535f42) {
            console[_0x51b1a5(0xe5)](_0x535f42);
        }
    }), win['on'](_0x539b1f[_0x13c845(0xa6)], () => win[_0x13c845(0x10c)]()), win['on'](_0x539b1f[_0x13c845(0xd7)], () => {
        const _0x5ffe29 = _0x13c845;
        win[_0x5ffe29(0x98)](), win = null;
        if (tray)
            tray[_0x5ffe29(0x98)]();
        tray = null;
    });
    let _0x3b9953 = folder + (_0x13c845(0x9e) + _0x13c845(0x90) + _0x13c845(0x9d));
    _0x539b1f[_0x13c845(0x108)](process[_0x13c845(0xcd)][_0x13c845(0xfc)][_0x13c845(0xdc)]('.')[-0x773 * 0x3 + -0x233c + 0x3995], 0xbd1 + -0x79 * -0xe + -0x126a * 0x1) && (_0x3b9953 = folder + _0x13c845(0xbe));
    let _0x45c516 = await Editor[_0x13c845(0x105)][_0x13c845(0x91)](_0x539b1f[_0x13c845(0xd9)], _0x539b1f[_0x13c845(0xe9)]), _0x59ab6a = path[_0x13c845(0xdd)](__dirname, _0x539b1f[_0x13c845(0x8b)](_0x539b1f[_0x13c845(0xb5)](_0x539b1f[_0x13c845(0xb5)](_0x539b1f[_0x13c845(0x8e)](_0x3b9953, _0x539b1f[_0x13c845(0xf6)]), _0x45c516), _0x539b1f[_0x13c845(0xd2)]), mode));
    win[_0x13c845(0xf2)](_0x13c845(0x102) + _0x59ab6a);
}
function tryShowWindow(_0x1c6bde) {
    const _0x34c149 = _0x49983f, _0x3627ca = {
            'kRYtj': _0x34c149(0x85),
            'HPxoY': _0x34c149(0xb4),
            'VVdAU': _0x34c149(0x100) + _0x34c149(0xfa),
            'cjDvj': _0x34c149(0x97) + 'ls',
            'kZiez': _0x34c149(0x10e) + _0x34c149(0x95),
            'TaqKl': function (_0x53be46) {
                return _0x53be46();
            }
        };
    try {
        let _0x7b1a37 = nativeImage[_0x34c149(0x10b) + _0x34c149(0x92)](path[_0x34c149(0xdd)](__dirname, _0x3627ca[_0x34c149(0xf1)]));
        _0x7b1a37 = _0x7b1a37[_0x34c149(0xf0)]({
            'width': 0x10,
            'height': 0x10
        });
        tray && tray[_0x34c149(0xf4)](_0x7b1a37);
        if (!tray) {
            tray = new Tray(_0x7b1a37), tray['on'](_0x3627ca[_0x34c149(0x99)], function () {
                const _0x15a140 = _0x34c149;
                win[_0x15a140(0x10c)]();
            });
            let _0x4393cc = new Menu();
            _0x4393cc[_0x34c149(0xee)](new MenuItem({
                'label': _0x3627ca[_0x34c149(0xac)],
                'click': function () {
                    const _0xa2dea7 = _0x34c149;
                    win && win[_0xa2dea7(0xdb) + 's'][_0xa2dea7(0xb2) + _0xa2dea7(0xa3)](_0xa2dea7(0x8f) + _0xa2dea7(0xa8) + _0xa2dea7(0xc5));
                }
            })), devTools && _0x4393cc[_0x34c149(0xee)](new MenuItem({
                'label': _0x3627ca[_0x34c149(0xda)],
                'click': function () {
                    const _0x532079 = _0x34c149;
                    win && win[_0x532079(0xdb) + 's'][_0x532079(0x10d) + 'ls']();
                }
            })), tray[_0x34c149(0xba) + _0x34c149(0xf5)](_0x4393cc);
        } else {
            if (devTools)
                console[_0x34c149(0xa2)](_0x3627ca[_0x34c149(0xef)]);
        }
    } catch (_0x32bcb8) {
        if (devTools)
            console[_0x34c149(0xe5)](_0x32bcb8);
    }
    mode = _0x1c6bde;
    try {
        _0x3627ca[_0x34c149(0xf3)](showWindow);
    } catch (_0x5401be) {
        console[_0x34c149(0xe5)](_0x5401be);
    }
}