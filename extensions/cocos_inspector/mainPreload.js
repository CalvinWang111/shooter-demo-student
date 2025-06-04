const _0x2939 = [
    '2594jHTTQV',
    '89ppjVXh',
    '218329gDJgfT',
    '../cocos-i',
    'readConfig',
    'readFileSy',
    'path',
    '222731qJaLMt',
    'QViBs',
    '179351QbpcKe',
    '1eQLHeV',
    'ync',
    '746913PsBsuJ',
    '1sPhxhm',
    'parse',
    '142254TyqBWr',
    'nspector-c',
    'utf-8',
    'config.jso',
    'saveConfig',
    'join',
    'existsSync',
    'WfznF',
    '11488pYBwcB',
    'writeFileS',
    'stringify',
    'onfig.json'
];
const _0x57eb13 = _0x4913;
(function (_0x3004bb, _0x4a4c90) {
    const _0x366989 = _0x4913;
    while (!![]) {
        try {
            const _0x2e41ad = -parseInt(_0x366989(0x1ab)) + -parseInt(_0x366989(0x1a5)) + parseInt(_0x366989(0x1aa)) * parseInt(_0x366989(0x1a9)) + parseInt(_0x366989(0x1b2)) * -parseInt(_0x366989(0x19b)) + parseInt(_0x366989(0x1b3)) * -parseInt(_0x366989(0x19d)) + -parseInt(_0x366989(0x1b0)) + parseInt(_0x366989(0x19a));
            if (_0x2e41ad === _0x4a4c90)
                break;
            else
                _0x3004bb['push'](_0x3004bb['shift']());
        } catch (_0x2bf002) {
            _0x3004bb['push'](_0x3004bb['shift']());
        }
    }
}(_0x2939, 0x67f7 * 0x7 + -0x7e59 + 0xc202));
function _0x4913(_0x4d342e, _0x4571aa) {
    _0x4d342e = _0x4d342e - (0x1fa + -0x22a3 * 0x1 + -0x1 * -0x2243);
    let _0x1fbd56 = _0x2939[_0x4d342e];
    return _0x1fbd56;
}
let fs = require('fs'), path = require(_0x57eb13(0x1af)), _configPath = path[_0x57eb13(0x1a2)](__dirname, _0x57eb13(0x1a0) + 'n'), __parentConfig = path[_0x57eb13(0x1a2)](__dirname, _0x57eb13(0x1ac) + _0x57eb13(0x19e) + _0x57eb13(0x1a8));
global[_0x57eb13(0x1ad)] = () => {
    const _0x345367 = _0x57eb13, _0x313d10 = { 'WfznF': _0x345367(0x19f) };
    let _0x1e7a83 = '';
    return fs[_0x345367(0x1a3)](__parentConfig) ? _0x1e7a83 = fs[_0x345367(0x1ae) + 'nc'](__parentConfig, { 'encoding': _0x313d10[_0x345367(0x1a4)] }) : _0x1e7a83 = fs[_0x345367(0x1ae) + 'nc'](_configPath, { 'encoding': _0x313d10[_0x345367(0x1a4)] }), JSON[_0x345367(0x19c)](_0x1e7a83);
}, global[_0x57eb13(0x1a1)] = _0x52b68e => {
    const _0x1fae49 = _0x57eb13, _0x425d4a = { 'QViBs': _0x1fae49(0x19f) };
    let _0x3bfd2b = JSON[_0x1fae49(0x1a7)](_0x52b68e);
    fs[_0x1fae49(0x1a6) + _0x1fae49(0x1b4)](__parentConfig, _0x3bfd2b, { 'encoding': _0x425d4a[_0x1fae49(0x1b1)] });
};