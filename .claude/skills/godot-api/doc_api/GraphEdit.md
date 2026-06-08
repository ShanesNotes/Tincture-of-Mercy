## GraphEdit <- Control

GraphEdit provides tools for creation, manipulation, and display of various graphs. Its main purpose in the engine is to power the visual programming systems, such as visual shaders, but it is also available for use in user projects. GraphEdit by itself is only an empty container, representing an infinite grid where GraphNodes can be placed. Each GraphNode represents a node in the graph, a single unit of data in the connected scheme. GraphEdit, in turn, helps to control various interactions with nodes and between nodes. When the user attempts to connect, disconnect, or delete a GraphNode, a signal is emitted in the GraphEdit, but no action is taken by default. It is the responsibility of the programmer utilizing this control to implement the necessary logic to determine how each request should be handled. **Performance:** It is greatly advised to enable low-processor usage mode (see `OS.low_processor_usage_mode`) when using GraphEdits. **Note:** Keep in mind that `Node.get_children` will also return the connection layer node named `_connection_layer` due to technical limitations. This behavior may change in future releases.

**Props:**
- ClipContents: bool = true
- ConnectionLinesAntialiased: bool = true
- ConnectionLinesCurvature: float = 0.5
- ConnectionLinesThickness: float = 4.0
- Connections: Dictionary[] = []
- FocusMode: int (Control.FocusMode) = 2
- GridPattern: int (GraphEdit.GridPattern) = 0
- MinimapEnabled: bool = true
- MinimapOpacity: float = 0.65
- MinimapSize: Vector2 = Vector2(240, 160)
- PanningScheme: int (GraphEdit.PanningScheme) = 0
- RightDisconnects: bool = false
- ScrollOffset: Vector2 = Vector2(0, 0)
- ShowArrangeButton: bool = true
- ShowGrid: bool = true
- ShowGridButtons: bool = true
- ShowMenu: bool = true
- ShowMinimapButton: bool = true
- ShowZoomButtons: bool = true
- ShowZoomLabel: bool = false
- SnappingDistance: int = 20
- SnappingEnabled: bool = true
- TypeNames: Godot.Collections.Dictionary = {}
- Zoom: float = 1.0
- ZoomMax: float = 2.0736003
- ZoomMin: float = 0.23256795
- ZoomStep: float = 1.2

- **connection_lines_antialiased**: If `true`, the lines between nodes will use antialiasing.
- **connection_lines_curvature**: The curvature of the lines between the nodes. 0 results in straight lines.
- **connection_lines_thickness**: The thickness of the lines between the nodes.
- **connections**: The connections between GraphNodes. A connection is represented as a Dictionary in the form of: Connections with `keep_alive` set to `false` may be deleted automatically if invalid during a redraw.
- **grid_pattern**: The pattern used for drawing the grid.
- **minimap_enabled**: If `true`, the minimap is visible.
- **minimap_opacity**: The opacity of the minimap rectangle.
- **minimap_size**: The size of the minimap rectangle. The map itself is based on the size of the grid area and is scaled to fit this rectangle.
- **panning_scheme**: Defines the control scheme for panning with mouse wheel.
- **right_disconnects**: If `true`, enables disconnection of existing connections in the GraphEdit by dragging the right end.
- **scroll_offset**: The scroll offset.
- **show_arrange_button**: If `true`, the button to automatically arrange graph nodes is visible.
- **show_grid**: If `true`, the grid is visible.
- **show_grid_buttons**: If `true`, buttons that allow to configure grid and snapping options are visible.
- **show_menu**: If `true`, the menu toolbar is visible.
- **show_minimap_button**: If `true`, the button to toggle the minimap is visible.
- **show_zoom_buttons**: If `true`, buttons that allow to change and reset the zoom level are visible.
- **show_zoom_label**: If `true`, the label with the current zoom level is visible. The zoom level is displayed in percents.
- **snapping_distance**: The snapping distance in pixels, also determines the grid line distance.
- **snapping_enabled**: If `true`, enables snapping.
- **type_names**: Dictionary of human-readable port type names.
- **zoom**: The current zoom value.
- **zoom_max**: The upper zoom limit.
- **zoom_min**: The lower zoom limit.
- **zoom_step**: The step of each zoom level.

**Methods:**
- GetConnectionLine(Vector2 fromPosition, Vector2 toPosition) -> Vector2[] - Virtual method which can be overridden to customize how connections are drawn.
- IsInInputHotzone(Object inNode, int inPort, Vector2 mousePosition) -> bool - Returns whether the `mouse_position` is in the input hot zone. By default, a hot zone is a Rect2 positioned such that its center is at `in_node`.`GraphNode.get_input_port_position`(`in_port`) (For output's case, call `GraphNode.get_output_port_position` instead). The hot zone's width is twice the Theme Property `port_grab_distance_horizontal`, and its height is twice the `port_grab_distance_vertical`. Below is a sample code to help get started:
- IsInOutputHotzone(Object inNode, int inPort, Vector2 mousePosition) -> bool - Returns whether the `mouse_position` is in the output hot zone. For more information on hot zones, see `_is_in_input_hotzone`. Below is a sample code to help get started:
- IsNodeHoverValid(StringName fromNode, int fromPort, StringName toNode, int toPort) -> bool - This virtual method can be used to insert additional error detection while the user is dragging a connection over a valid port. Return `true` if the connection is indeed valid or return `false` if the connection is impossible. If the connection is impossible, no snapping to the port and thus no connection request to that port will happen. In this example a connection to same node is suppressed:
- AddValidConnectionType(int fromType, int toType) - Allows the connection between two different port types. The port type is defined individually for the left and the right port of each slot with the `GraphNode.set_slot` method. See also `is_valid_connection_type` and `remove_valid_connection_type`.
- AddValidLeftDisconnectType(int type) - Allows to disconnect nodes when dragging from the left port of the GraphNode's slot if it has the specified type. See also `remove_valid_left_disconnect_type`.
- AddValidRightDisconnectType(int type) - Allows to disconnect nodes when dragging from the right port of the GraphNode's slot if it has the specified type. See also `remove_valid_right_disconnect_type`.
- ArrangeNodes() - Rearranges selected nodes in a layout with minimum crossings between connections and uniform horizontal and vertical gap between nodes.
- AttachGraphElementToFrame(StringName element, StringName frame) - Attaches the `element` GraphElement to the `frame` GraphFrame.
- ClearConnections() - Removes all connections between nodes.
- ConnectNode(StringName fromNode, int fromPort, StringName toNode, int toPort, bool keepAlive = false) -> int - Create a connection between the `from_port` of the `from_node` GraphNode and the `to_port` of the `to_node` GraphNode. If the connection already exists, no connection is created. Connections with `keep_alive` set to `false` may be deleted automatically if invalid during a redraw.
- DetachGraphElementFromFrame(StringName element) - Detaches the `element` GraphElement from the GraphFrame it is currently attached to.
- DisconnectNode(StringName fromNode, int fromPort, StringName toNode, int toPort) - Removes the connection between the `from_port` of the `from_node` GraphNode and the `to_port` of the `to_node` GraphNode. If the connection does not exist, no connection is removed.
- ForceConnectionDragEnd() - Ends the creation of the current connection. In other words, if you are dragging a connection you can use this method to abort the process and remove the line that followed your cursor. This is best used together with `connection_drag_started` and `connection_drag_ended` to add custom behavior like node addition through shortcuts. **Note:** This method suppresses any other connection request signals apart from `connection_drag_ended`.
- GetAttachedNodesOfFrame(StringName frame) -> StringName[] - Returns an array of node names that are attached to the GraphFrame with the given name.
- GetClosestConnectionAtPoint(Vector2 point, float maxDistance = 4.0) -> Godot.Collections.Dictionary - Returns the closest connection to the given point in screen space. If no connection is found within `max_distance` pixels, an empty Dictionary is returned. A connection is represented as a Dictionary in the form of: For example, getting a connection at a given mouse position can be achieved like this:
- GetConnectionCount(StringName fromNode, int fromPort) -> int - Returns the number of connections from `from_port` of `from_node`.
- GetConnectionLine(Vector2 fromNode, Vector2 toNode) -> Vector2[] - Returns the points which would make up a connection between `from_node` and `to_node`.
- GetConnectionListFromNode(StringName node) -> Dictionary[] - Returns an Array containing a list of all connections for `node`. A connection is represented as a Dictionary in the form of: **Example:** Get all connections on a specific port:
- GetConnectionsIntersectingWithRect(Rect2 rect) -> Dictionary[] - Returns an Array containing the list of connections that intersect with the given Rect2. A connection is represented as a Dictionary in the form of:
- GetElementFrame(StringName element) -> GraphFrame - Returns the GraphFrame that contains the GraphElement with the given name.
- GetMenuHbox() -> HBoxContainer - Gets the HBoxContainer that contains the zooming and grid snap controls in the top left of the graph. You can use this method to reposition the toolbar or to add your own custom controls to it. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `CanvasItem.visible` property.
- IsNodeConnected(StringName fromNode, int fromPort, StringName toNode, int toPort) -> bool - Returns `true` if the `from_port` of the `from_node` GraphNode is connected to the `to_port` of the `to_node` GraphNode.
- IsValidConnectionType(int fromType, int toType) -> bool - Returns whether it's possible to make a connection between two different port types. The port type is defined individually for the left and the right port of each slot with the `GraphNode.set_slot` method. See also `add_valid_connection_type` and `remove_valid_connection_type`.
- RemoveValidConnectionType(int fromType, int toType) - Disallows the connection between two different port types previously allowed by `add_valid_connection_type`. The port type is defined individually for the left and the right port of each slot with the `GraphNode.set_slot` method. See also `is_valid_connection_type`.
- RemoveValidLeftDisconnectType(int type) - Disallows to disconnect nodes when dragging from the left port of the GraphNode's slot if it has the specified type. Use this to disable a disconnection previously allowed with `add_valid_left_disconnect_type`.
- RemoveValidRightDisconnectType(int type) - Disallows to disconnect nodes when dragging from the right port of the GraphNode's slot if it has the specified type. Use this to disable a disconnection previously allowed with `add_valid_right_disconnect_type`.
- SetConnectionActivity(StringName fromNode, int fromPort, StringName toNode, int toPort, float amount) - Sets the coloration of the connection between `from_node`'s `from_port` and `to_node`'s `to_port` with the color provided in the [theme_item activity] theme property. The color is linearly interpolated between the connection color and the activity color using `amount` as weight.
- SetSelected(Node node) - Sets the specified `node` as the one selected.

**Signals:**
- BeginNodeMove - Emitted at the beginning of a GraphElement's movement.
- ConnectionDragEnded - Emitted at the end of a connection drag.
- ConnectionDragStarted(StringName fromNode, int fromPort, bool isOutput) - Emitted at the beginning of a connection drag.
- ConnectionFromEmpty(StringName toNode, int toPort, Vector2 releasePosition) - Emitted when user drags a connection from an input port into the empty space of the graph.
- ConnectionRequest(StringName fromNode, int fromPort, StringName toNode, int toPort) - Emitted to the GraphEdit when the connection between the `from_port` of the `from_node` GraphNode and the `to_port` of the `to_node` GraphNode is attempted to be created.
- ConnectionToEmpty(StringName fromNode, int fromPort, Vector2 releasePosition) - Emitted when user drags a connection from an output port into the empty space of the graph.
- CopyNodesRequest - Emitted when this GraphEdit captures a `ui_copy` action ([kbd]Ctrl + C[/kbd] by default). In general, this signal indicates that the selected GraphElements should be copied.
- CutNodesRequest - Emitted when this GraphEdit captures a `ui_cut` action ([kbd]Ctrl + X[/kbd] by default). In general, this signal indicates that the selected GraphElements should be cut.
- DeleteNodesRequest(StringName[] nodes) - Emitted when this GraphEdit captures a `ui_graph_delete` action ([kbd]Delete[/kbd] by default). `nodes` is an array of node names that should be removed. These usually include all selected nodes.
- DisconnectionRequest(StringName fromNode, int fromPort, StringName toNode, int toPort) - Emitted to the GraphEdit when the connection between `from_port` of `from_node` GraphNode and `to_port` of `to_node` GraphNode is attempted to be removed.
- DuplicateNodesRequest - Emitted when this GraphEdit captures a `ui_graph_duplicate` action ([kbd]Ctrl + D[/kbd] by default). In general, this signal indicates that the selected GraphElements should be duplicated.
- EndNodeMove - Emitted at the end of a GraphElement's movement.
- FrameRectChanged(GraphFrame frame, Rect2 newRect) - Emitted when the GraphFrame `frame` is resized to `new_rect`.
- GraphElementsLinkedToFrameRequest(Godot.Collections.Array elements, StringName frame) - Emitted when one or more GraphElements are dropped onto the GraphFrame named `frame`, when they were not previously attached to any other one. `elements` is an array of GraphElements to be attached.
- NodeDeselected(Node node) - Emitted when the given GraphElement node is deselected.
- NodeSelected(Node node) - Emitted when the given GraphElement node is selected.
- PasteNodesRequest - Emitted when this GraphEdit captures a `ui_paste` action ([kbd]Ctrl + V[/kbd] by default). In general, this signal indicates that previously copied GraphElements should be pasted.
- PopupRequest(Vector2 atPosition) - Emitted when a popup is requested. Happens on right-clicking in the GraphEdit. `at_position` is the position of the mouse pointer when the signal is sent.
- ScrollOffsetChanged(Vector2 offset) - Emitted when the scroll offset is changed by the user. It will not be emitted when changed in code.

**Enums:**
**PanningScheme:** SCROLL_ZOOMS=0, SCROLL_PANS=1
  - SCROLL_ZOOMS: [kbd]Mouse Wheel[/kbd] will zoom, [kbd]Ctrl + Mouse Wheel[/kbd] will move the view.
  - SCROLL_PANS: [kbd]Mouse Wheel[/kbd] will move the view, [kbd]Ctrl + Mouse Wheel[/kbd] will zoom.
**GridPattern:** GRID_PATTERN_LINES=0, GRID_PATTERN_DOTS=1
  - GRID_PATTERN_LINES: Draw the grid using solid lines.
  - GRID_PATTERN_DOTS: Draw the grid using dots.

