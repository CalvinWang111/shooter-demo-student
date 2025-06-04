import { _decorator, BatchingUtility, Component, MeshRenderer, Node, warn } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('StaticMeshBatcher')
export class StaticMeshBatcher extends Component {

    @property({ tooltip: '當合併完成時, 是否銷毀自身節點' })
    destroySelf = true;

    start() {
        const myNode = this.node;
        const newRoot = new Node(`${myNode.name}_Batched`);
        newRoot.layer = myNode.layer;
        newRoot.setParent(myNode.parent);
        newRoot.setSiblingIndex(myNode.getSiblingIndex());
        newRoot.setRTS(myNode.rotation, myNode.position, myNode.scale);

        const isDone = BatchingUtility.batchStaticModel(myNode, newRoot);
        if (!isDone) {
            warn('Meshes are batching failed.');
            newRoot.destroy();
            return;
        }

        // 抓取舊的 MeshRenderer 的陰影模式和接收陰影屬性 (預設都吃相同設定)
        const oldMeshRenderer = myNode.getComponentInChildren(MeshRenderer);
        const newMeshRenderer = newRoot.getComponent(MeshRenderer);
        const shadowCastingMode = oldMeshRenderer.shadowCastingMode;
        const receiveShadow = oldMeshRenderer.receiveShadow;

        newMeshRenderer.shadowCastingMode = shadowCastingMode;
        newMeshRenderer.receiveShadow = receiveShadow;

        if (this.destroySelf)
            myNode.destroy();
    }

}
