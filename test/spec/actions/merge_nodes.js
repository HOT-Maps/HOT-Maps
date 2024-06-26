describe('iD.actionMergeNodes', function () {

    describe('#disabled', function () {
        it('enabled for both internal and endpoint nodes', function() {
            //
            // a --- b --- c
            //
            //       d
            //       |
            //       e
            //
            var graph = iD.coreGraph([
                iD.osmNode({ id: 'a', loc: [-2,  2] }),
                iD.osmNode({ id: 'b', loc: [ 0,  2] }),
                iD.osmNode({ id: 'c', loc: [ 2,  2] }),
                iD.osmNode({ id: 'd', loc: [ 0,  0] }),
                iD.osmNode({ id: 'e', loc: [ 0, -2] }),
                iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
                iD.osmWay({ id: '|', nodes: ['d', 'e'] })
            ]);

            expect(iD.actionMergeNodes(['b', 'e']).disabled(graph)).to.be.not.ok;
        });
    });


    it('merges two isolated nodes, averaging loc', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, 0] }),
            iD.osmNode({ id: 'b', loc: [4, 4] })
        ]);

        graph = iD.actionMergeNodes(['a', 'b'])(graph);

        expect(graph.hasEntity('a')).to.be.undefined;

        var survivor = graph.hasEntity('b');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.loc).to.eql([2, 2], 'average loc');
    });


    it('merges two isolated nodes, merging tags, and keeping loc of the interesting node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, 0], tags: { highway: 'traffic_signals' }}),
            iD.osmNode({ id: 'b', loc: [4, 4] })
        ]);

        graph = iD.actionMergeNodes(['a', 'b'])(graph);

        expect(graph.hasEntity('a')).to.be.undefined;

        var survivor = graph.hasEntity('b');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals' }, 'merge all tags');
        expect(survivor.loc).to.eql([0, 0], 'use loc of interesting node');
    });


    it('merges two isolated nodes, merging tags, and averaging loc of both interesting nodes', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [0, -2], tags: { highway: 'traffic_signals' } }),
            iD.osmNode({ id: 'b', loc: [0,  2], tags: { crossing: 'marked' } })
        ]);
        graph = iD.actionMergeNodes(['a', 'b'])(graph);

        expect(graph.hasEntity('a')).to.be.undefined;

        var survivor = graph.hasEntity('b');
        expect(survivor.tags).to.eql({ highway: 'traffic_signals', crossing: 'marked' }, 'merge all tags');
        expect(survivor.loc).to.eql([0, 0], 'average loc of both interesting nodes');
    });


    it('keeps the id of the interesting node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'n1', loc: [0, 0] }),
            iD.osmNode({ id: 'n2', loc: [4, 4], tags: { highway: 'traffic_signals' }})
        ]);

        graph = iD.actionMergeNodes(['n1', 'n2'])(graph);

        expect(graph.hasEntity('n1')).to.be.undefined;

        var survivor = graph.hasEntity('n2');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals' }, 'merge all tags');
        expect(survivor.loc).to.eql([4, 4], 'use loc of interesting node');
    });


    it('keeps the id of the existing node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'n1', loc: [0, 0] }),
            iD.osmNode({ id: 'b', loc: [4, 4], tags: { highway: 'traffic_signals' }})
        ]);

        graph = iD.actionMergeNodes(['n1', 'b'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;

        var survivor = graph.hasEntity('n1');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.tags).to.eql({ highway: 'traffic_signals' }, 'merge all tags');
        expect(survivor.loc).to.eql([4, 4], 'use loc of interesting node');
    });


    it('keeps the id of the oldest node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'n2', loc: [0, 0] }),
            iD.osmNode({ id: 'n1', loc: [2, 2] }),
            iD.osmNode({ id: 'n3', loc: [4, 4] })
        ]);

        graph = iD.actionMergeNodes(['n2', 'n1', 'n3'])(graph);

        expect(graph.hasEntity('n2')).to.be.undefined;
        expect(graph.hasEntity('n3')).to.be.undefined;

        var survivor = graph.hasEntity('n1');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
    });


    it('keeps the id of the oldest interesting node', function() {
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'n3', loc: [0, 0] }),
            iD.osmNode({ id: 'n1', loc: [2, 2] }),
            iD.osmNode({ id: 'n2', loc: [4, 4], tags: { highway: 'traffic_signals' }}),
            iD.osmNode({ id: 'n4', loc: [8, 8], tags: { crossing: 'marked' }})
        ]);

        graph = iD.actionMergeNodes(['n2', 'n1', 'n3', 'n4'])(graph);

        expect(graph.hasEntity('n1')).to.be.undefined;
        expect(graph.hasEntity('n3')).to.be.undefined;
        expect(graph.hasEntity('n4')).to.be.undefined;

        var survivor = graph.hasEntity('n2');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
    });


    it('merges two nodes along a single way', function() {
        //
        //  scenario:         merge b,c:
        //
        //  a -- b -- c       a ---- c
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  2] }),
            iD.osmNode({ id: 'b', loc: [ 0,  2] }),
            iD.osmNode({ id: 'c', loc: [ 2,  2] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'c'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;

        var survivor = graph.hasEntity('c');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.loc).to.eql([1, 2]);
        expect(graph.parentWays(survivor).length).to.equal(1);
    });


    it('merges two nodes from two ways', function() {
        //
        //  scenario:        merge b,d:
        //
        //  a -- b -- c      a -_   _- c
        //                        d
        //       d                |
        //       |                |
        //       e                e
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  2] }),
            iD.osmNode({ id: 'b', loc: [ 0,  2] }),
            iD.osmNode({ id: 'c', loc: [ 2,  2] }),
            iD.osmNode({ id: 'd', loc: [ 0,  0] }),
            iD.osmNode({ id: 'e', loc: [ 0, -2] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b', 'c'] }),
            iD.osmWay({ id: '|', nodes: ['d', 'e'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'd'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;

        var survivor = graph.hasEntity('d');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.loc).to.eql([0, 1]);
        expect(graph.parentWays(survivor).length).to.equal(2);
    });


    it('merges three nodes from three ways', function () {
        //
        //  scenario:        merge b,d,e:
        //
        //        c                c
        //        |                |
        //        d                |
        //                         |
        //  a --- b          a --- e
        //                         ‖
        //        e                ‖
        //        ‖                ‖
        //        f                f
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'a', loc: [-2,  0] }),
            iD.osmNode({ id: 'b', loc: [ 0,  0] }),
            iD.osmNode({ id: 'c', loc: [ 0,  4] }),
            iD.osmNode({ id: 'd', loc: [ 0,  2] }),
            iD.osmNode({ id: 'e', loc: [ 0, -2] }),
            iD.osmNode({ id: 'f', loc: [ 0, -4] }),
            iD.osmWay({ id: '-', nodes: ['a', 'b'] }),
            iD.osmWay({ id: '|', nodes: ['c', 'd'] }),
            iD.osmWay({ id: '‖', nodes: ['e', 'f'] })
        ]);

        graph = iD.actionMergeNodes(['b', 'd', 'e'])(graph);

        expect(graph.hasEntity('b')).to.be.undefined;
        expect(graph.hasEntity('d')).to.be.undefined;

        var survivor = graph.hasEntity('e');
        expect(survivor).to.be.an.instanceof(iD.osmNode);
        expect(survivor.loc).to.eql([0, 0]);
        expect(graph.parentWays(survivor).length).to.equal(3);
    });

});
