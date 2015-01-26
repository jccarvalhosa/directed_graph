This is an extension of Mike Bostock's [Draggable Network II](http://bl.ocks.org/mbostock/4566102) example, allowing one to drag multiple nodes in a force-directed graph. Nodes can be selected by dragging on the canvas and moved by dragging on the selected nodes.

The key changes are the additional handlers for `dragstart` and `dragend` which mark the selected nodes as `fixed` when starting to drag and unmark them when the dragging is complete so that the force can be computed.
