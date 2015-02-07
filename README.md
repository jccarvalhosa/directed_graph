This is an extension of Mike Bostock's [Draggable Network II](http://bl.ocks.org/mbostock/4566102) example, allowing one to drag multiple nodes in a force-directed graph. Nodes can be selected by holding the shift key and either dragging on the canvas or clicking on specific nodes. The selection and dragging semantics aim to mirror those of most window managers:

1. Shift clicking on a node toggles whether it is selected
2. Clicking (without shift) on a node, selects it and deselects everything else.
3. Shift dragging on the canvas toggles the selection status of the nodes enclosed within it.
4. Dragging a set of selected nodes drags all of them.
5. Clicking on the canvas de-selects everything.

