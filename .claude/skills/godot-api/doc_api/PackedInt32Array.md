## PackedInt32Array

An array specifically designed to hold 32-bit integer values. Packs data tightly, so it saves memory for large array sizes. **Note:** This type stores signed 32-bit integers, which means it can take values in the interval `[-2^31, 2^31 - 1]`, i.e. `[-2147483648, 2147483647]`. Exceeding those bounds will wrap around. In comparison, [int] uses signed 64-bit integers which can hold much larger values. If you need to pack 64-bit integers tightly, see PackedInt64Array. **Note:** Packed arrays are always passed by reference. To get a copy of an array that can be modified independently of the original array, use `duplicate`. This is *not* the case for built-in properties and methods. In these cases the returned packed array is a copy, and changing it will *not* affect the original value. To update a built-in property of this type, modify the returned array and then assign it to the property again. **Note:** In a boolean context, a packed array will evaluate to `false` if it's empty. Otherwise, a packed array will always evaluate to `true`.

**Methods:**
- Append(int value) -> bool - Appends an element at the end of the array (alias of `push_back`).
- AppendArray(int[] array) - Appends a PackedInt32Array at the end of this array.
- Bsearch(int value, bool before = true) -> int - Finds the index of an existing value (or the insertion index that maintains sorting order, if the value is not yet present in the array) using binary search. Optionally, a `before` specifier can be passed. If `false`, the returned index comes after all existing entries of the value in the array. **Note:** Calling `bsearch` on an unsorted array results in unexpected behavior.
- Clear() - Clears the array. This is equivalent to using `resize` with a size of `0`.
- Count(int value) -> int - Returns the number of times an element is in the array.
- Duplicate() -> int[] - Creates a copy of the array, and returns it.
- Erase(int value) -> bool - Removes the first occurrence of a value from the array and returns `true`. If the value does not exist in the array, nothing happens and `false` is returned. To remove an element by index, use `remove_at` instead.
- Fill(int value) - Assigns the given value to all elements in the array. This can typically be used together with `resize` to create an array with a given size and initialized elements.
- Find(int value, int from = 0) -> int - Searches the array for a value and returns its index or `-1` if not found. Optionally, the initial search index can be passed.
- Get(int index) -> int - Returns the 32-bit integer at the given `index` in the array. If `index` is out-of-bounds or negative, this method fails and returns `0`. This method is similar (but not identical) to the `[]` operator. Most notably, when this method fails, it doesn't pause project execution if run from the editor.
- Has(int value) -> bool - Returns `true` if the array contains `value`.
- Insert(int atIndex, int value) -> int - Inserts a new integer at a given position in the array. The position must be valid, or at the end of the array (`idx == size()`).
- IsEmpty() -> bool - Returns `true` if the array is empty.
- PushBack(int value) -> bool - Appends a value to the array.
- RemoveAt(int index) - Removes an element from the array by index.
- Resize(int newSize) -> int - Sets the size of the array. If the array is grown, reserves elements at the end of the array. If the array is shrunk, truncates the array to the new size. Calling `resize` once and assigning the new values is faster than adding new elements one by one. Returns `OK` on success, or one of the following `Error` constants if this method fails: `ERR_INVALID_PARAMETER` if the size is negative, or `ERR_OUT_OF_MEMORY` if allocations fail. Use `size` to find the actual size of the array after resize.
- Reverse() - Reverses the order of the elements in the array.
- Rfind(int value, int from = -1) -> int - Searches the array in reverse order. Optionally, a start search index can be passed. If negative, the start index is considered relative to the end of the array.
- Set(int index, int value) - Changes the integer at the given index.
- Size() -> int - Returns the number of elements in the array.
- Slice(int begin, int end = 2147483647) -> int[] - Returns the slice of the PackedInt32Array, from `begin` (inclusive) to `end` (exclusive), as a new PackedInt32Array. The absolute value of `begin` and `end` will be clamped to the array size, so the default value for `end` makes it slice to the size of the array by default (i.e. `arr.slice(1)` is a shorthand for `arr.slice(1, arr.size())`). If either `begin` or `end` are negative, they will be relative to the end of the array (i.e. `arr.slice(0, -2)` is a shorthand for `arr.slice(0, arr.size() - 2)`).
- Sort() - Sorts the elements of the array in ascending order.
- ToByteArray() -> byte[] - Returns a copy of the data converted to a PackedByteArray, where each element has been encoded as 4 bytes. The size of the new array will be `int32_array.size() * 4`.

