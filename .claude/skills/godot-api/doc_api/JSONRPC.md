## JSONRPC <- Object

is a standard which wraps a method call in a JSON object. The object has a particular structure and identifies which method is called, the parameters to that function, and carries an ID to keep track of responses. This class implements that standard on top of Dictionary; you will have to convert between a Dictionary and JSON with other functions.

**Methods:**
- MakeNotification(string method, Variant params) -> Godot.Collections.Dictionary - Returns a dictionary in the form of a JSON-RPC notification. Notifications are one-shot messages which do not expect a response. - `method`: Name of the method being called. - `params`: An array or dictionary of parameters being passed to the method.
- MakeRequest(string method, Variant params, Variant id) -> Godot.Collections.Dictionary - Returns a dictionary in the form of a JSON-RPC request. Requests are sent to a server with the expectation of a response. The ID field is used for the server to specify which exact request it is responding to. - `method`: Name of the method being called. - `params`: An array or dictionary of parameters being passed to the method. - `id`: Uniquely identifies this request. The server is expected to send a response with the same ID.
- MakeResponse(Variant result, Variant id) -> Godot.Collections.Dictionary - When a server has received and processed a request, it is expected to send a response. If you did not want a response then you need to have sent a Notification instead. - `result`: The return value of the function which was called. - `id`: The ID of the request this response is targeted to.
- MakeResponseError(int code, string message, Variant id = null) -> Godot.Collections.Dictionary - Creates a response which indicates a previous reply has failed in some way. - `code`: The error code corresponding to what kind of error this is. See the `ErrorCode` constants. - `message`: A custom message about this error. - `id`: The request this error is a response to.
- ProcessAction(Variant action, bool recurse = false) -> Variant - Given a Dictionary which takes the form of a JSON-RPC request: unpack the request and run it. Methods are resolved by looking at the field called "method" and looking for an equivalently named function in the JSONRPC object. If one is found that method is called. To add new supported methods extend the JSONRPC class and call `process_action` on your subclass. `action`: The action to be run, as a Dictionary in the form of a JSON-RPC request or notification.
- ProcessString(string action) -> string
- SetMethod(string name, Callable callback) - Registers a callback for the given method name. - `name`: The name that clients can use to access the callback. - `callback`: The callback which will handle the specified method.

**Enums:**
**ErrorCode:** PARSE_ERROR=-32700, INVALID_REQUEST=-32600, METHOD_NOT_FOUND=-32601, INVALID_PARAMS=-32602, INTERNAL_ERROR=-32603
  - PARSE_ERROR: The request could not be parsed as it was not valid by JSON standard (`JSON.parse` failed).
  - INVALID_REQUEST: A method call was requested but the request's format is not valid.
  - METHOD_NOT_FOUND: A method call was requested but no function of that name existed in the JSONRPC subclass.
  - INVALID_PARAMS: A method call was requested but the given method parameters are not valid. Not used by the built-in JSONRPC.
  - INTERNAL_ERROR: An internal error occurred while processing the request. Not used by the built-in JSONRPC.

