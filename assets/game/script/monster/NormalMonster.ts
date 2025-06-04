import { _decorator } from 'cc';
import { OnBoardMonster } from './OnBoardMonster';

const { ccclass, property } = _decorator;

@ccclass('NormalMonster')
export class NormalMonster extends OnBoardMonster {

    init(no: number, id: number) {
        super.init(no, id);

        // 一般怪物只有一個賠率
        this.oddsIndex = 0;
        this.oddsText.string = `X${this.getOdds()}`;
    }

}
