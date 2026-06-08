## AnimationLibrary <- Resource

An animation library stores a set of animations accessible through StringName keys, for use with AnimationPlayer nodes.

**Methods:**
- AddAnimation(StringName name, Animation animation) -> int - Adds the `animation` to the library, accessible by the key `name`.
- GetAnimation(StringName name) -> Animation - Returns the Animation with the key `name`. If the animation does not exist, `null` is returned and an error is logged.
- GetAnimationList() -> StringName[] - Returns the keys for the Animations stored in the library.
- GetAnimationListSize() -> int - Returns the key count for the Animations stored in the library.
- HasAnimation(StringName name) -> bool - Returns `true` if the library stores an Animation with `name` as the key.
- RemoveAnimation(StringName name) - Removes the Animation with the key `name`.
- RenameAnimation(StringName name, StringName newname) - Changes the key of the Animation associated with the key `name` to `newname`.

**Signals:**
- AnimationAdded(StringName name) - Emitted when an Animation is added, under the key `name`.
- AnimationChanged(StringName name) - Emitted when there's a change in one of the animations, e.g. tracks are added, moved or have changed paths. `name` is the key of the animation that was changed. See also `Resource.changed`, which this acts as a relay for.
- AnimationRemoved(StringName name) - Emitted when an Animation stored with the key `name` is removed.
- AnimationRenamed(StringName name, StringName toName) - Emitted when the key for an Animation is changed, from `name` to `to_name`.

