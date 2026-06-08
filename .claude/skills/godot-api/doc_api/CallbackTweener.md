## CallbackTweener <- Tweener

CallbackTweener is used to call a method in a tweening sequence. See `Tween.tween_callback` for more usage information. The tweener will finish automatically if the callback's target object is freed. **Note:** `Tween.tween_callback` is the only correct way to create CallbackTweener. Any CallbackTweener created manually will not function correctly.

**Methods:**
- SetDelay(float delay) -> CallbackTweener - Makes the callback call delayed by given time in seconds. **Example:** Call `Node.queue_free` after 2 seconds:

